import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, checkDailyBudget } from "../_shared/ratelimit.ts";
import { handleRegenerateOnly } from "../_shared/regenerate-only.ts";
import { createLogger, trackEvent } from "../_shared/observe.ts";
import { writeCompanionData } from "../_shared/companion-data.ts";
import { generateSignal, PROMPT_VERSION as SIGNAL_VERSION } from "../_shared/generators/signal.ts";
import { generateGrounding, PROMPT_VERSION as GROUNDING_VERSION } from "../_shared/generators/grounding.ts";
import { generateHistory, PROMPT_VERSION as HISTORY_VERSION } from "../_shared/generators/history.ts";
import { generateZoomOut, PROMPT_VERSION as ZOOM_OUT_VERSION } from "../_shared/generators/zoom-out.ts";
import { generateQuestion } from "../_shared/generators/question.ts";
import { determineSessionIntent } from "../_shared/session-intent.ts";
import { selectIntervention, parseDirection, bucketSeverity, type InterventionSelection } from "../_shared/intervention-selector.ts";
import { fetchGroundingSourcesForOrchestrate } from "../_shared/pause-cron-parity.ts";
import { fetchRecentSignalCitationUrls, mergeRecentSignalUrls } from "../_shared/recent-signal-urls.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Companion Orchestrator
 *
 * Single entry point for intervention selection and companion generation.
 *
 * Client invocation modes:
 * - Intervention-only: all enable* false, useIntervention true (mount)
 * - Single-slot lazy: one enable* true (card tap, holzenInvokeSource: browser_lazy_fetch)
 * - Regenerate: regenerateOnly param (explicit user action)
 *
 * Cron/pregenerate may enable multiple slots in one request; enabled tasks
 * run in parallel via Promise.allSettled.
 *
 * Generator phase ordering (library → cache → live → curated) is controlled
 * by COMPANION_PHASE_* env vars in _shared/phase-config.ts.
 *
 * Generators are invoked directly (in-process) instead of via HTTP.
 */

interface CompanionResult {
  data: any | null;
  source: "live" | "cache" | "curated" | "empty";
  cacheId: string | null;
  latencyMs: number;
  /** Prompt version from the generator — stored as content_fingerprint for regression tracking. */
  promptVersion?: string;
  /** Present when source is `empty` (e.g. DISABLE_COMPANION_FALLBACKS). */
  error?: string;
}

interface InterventionPayload {
  mode: "insight" | "question";
  primary: { type: string; data: any } | null;
  secondary: { type: string; data: any } | null;
  question: string | null;
}

interface OrchestrateResponse {
  // Legacy fields — kept for backward compat, null in the new intervention flow
  signal: CompanionResult | null;
  grounding: CompanionResult | null;
  history: CompanionResult | null;
  zoomOut: CompanionResult | null;
  // New structured intervention response
  intervention: InterventionPayload | null;
}

type OrchestrateSourceInput = {
  name: string;
  type: string;
  url?: string;
};

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === "string" && item.length > 0);
  return items.length > 0 ? items : undefined;
}

function asSourceArray(value: unknown): OrchestrateSourceInput[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const entry = item as Record<string, unknown>;
    if (typeof entry.name !== "string" || entry.name.length === 0) return [];
    if (typeof entry.type !== "string" || entry.type.length === 0) return [];

    const source: OrchestrateSourceInput = { name: entry.name, type: entry.type };
    if (typeof entry.url === "string" && entry.url.length > 0) {
      source.url = entry.url;
    }
    return [source];
  });

  return items.length > 0 ? items : undefined;
}

function isCompanionContent(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function contentSatisfiesCompanion(companionType: string, raw: unknown): boolean {
  if (raw == null || typeof raw !== "object") return false;
  const c = raw as Record<string, unknown>;
  switch (companionType) {
    case "signal":
      return typeof c.source === "string" && c.source.length > 0;
    case "ground_nudge":
      return typeof c.title === "string" && c.title.length > 0 &&
        typeof c.body === "string" && c.body.length > 0;
    case "historical_insight":
      return typeof c.btcInsight === "string" && c.btcInsight.length > 0;
    case "zoom_out":
    case "zoom_out_deep_time":
      return Object.keys(c).length > 0;
    case "intervention":
      return typeof c.mode === "string" && c.mode.length > 0;
    default:
      return false;
  }
}

/**
 * If reflection_companions already has every slot this invoke would generate, return a
 * response assembled from DB rows (source "cache") and skip AI, rate limit, and budget.
 * Grep: orchestrate_skip_cached
 */
async function tryOrchestrateSkipFromReflectionCompanions(params: {
  svcClient: any;
  reflectionId: string;
  useIntervention: boolean;
  needSignal: boolean;
  needGrounding: boolean;
  needHistory: boolean;
  needZoomOut: boolean;
  log: ReturnType<typeof createLogger>;
}): Promise<OrchestrateResponse | null> {
  const { data: rows, error } = await params.svcClient
    .from("reflection_companions")
    .select("companion_type, content")
    .eq("reflection_id", params.reflectionId);
  if (error || !rows?.length) return null;

  const byType = new Map<string, unknown>();
  for (const r of rows) {
    byType.set(r.companion_type as string, r.content);
  }

  const hasSignal = () => contentSatisfiesCompanion("signal", byType.get("signal"));
  const hasGrounding = () => contentSatisfiesCompanion("ground_nudge", byType.get("ground_nudge"));
  const hasHistory = () => contentSatisfiesCompanion("historical_insight", byType.get("historical_insight"));
  const hasZoom = () =>
    contentSatisfiesCompanion("zoom_out_deep_time", byType.get("zoom_out_deep_time")) ||
    contentSatisfiesCompanion("zoom_out", byType.get("zoom_out"));
  const hasIntervention = () => contentSatisfiesCompanion("intervention", byType.get("intervention"));

  if (params.needSignal && !hasSignal()) return null;
  if (params.needGrounding && !hasGrounding()) return null;
  if (params.needHistory && !hasHistory()) return null;
  if (params.needZoomOut && !hasZoom()) return null;
  if (params.useIntervention && !hasIntervention()) return null;

  const zoomRaw = byType.get("zoom_out_deep_time") ?? byType.get("zoom_out");

  const response: OrchestrateResponse = {
    signal: params.needSignal
      ? { data: byType.get("signal"), source: "cache", cacheId: null, latencyMs: 0 }
      : null,
    grounding: params.needGrounding
      ? { data: byType.get("ground_nudge"), source: "cache", cacheId: null, latencyMs: 0 }
      : null,
    history: params.needHistory
      ? { data: byType.get("historical_insight"), source: "cache", cacheId: null, latencyMs: 0 }
      : null,
    zoomOut: params.needZoomOut
      ? { data: zoomRaw, source: "cache", cacheId: null, latencyMs: 0 }
      : null,
    intervention: params.useIntervention
      ? (byType.get("intervention") as InterventionPayload)
      : null,
  };

  params.log("skip: all requested companion rows already on reflection_companions");
  try {
    console.log(JSON.stringify({
      holzen_event: "orchestrate_skip_cached",
      reflection_prefix: params.reflectionId.slice(0, 8),
      need_signal: params.needSignal,
      need_grounding: params.needGrounding,
      need_history: params.needHistory,
      need_zoom: params.needZoomOut,
      need_intervention: params.useIntervention,
      ts: new Date().toISOString(),
    }));
  } catch { /* ignore */ }

  return response;
}

/** Client/cron overlap metrics — grep: orchestrate_invoke */
function logOrchestrateInvoke(body: Record<string, unknown>, authMode: "service_role" | "user_jwt") {
  const raw = body.holzenInvokeSource;
  const invokeSource =
    typeof raw === "string" && /^[a-z0-9_.:-]+$/i.test(raw) && raw.length <= 48
      ? raw
      : "unknown";
  const rid = body.reflectionId;
  const reflectionPrefix = typeof rid === "string" && rid.length >= 8 ? rid.slice(0, 8) : null;
  const regen = body.regenerateOnly;
  try {
    console.log(
      JSON.stringify({
        holzen_event: "orchestrate_invoke",
        invoke_source: invokeSource,
        auth_mode: authMode,
        reflection_prefix: reflectionPrefix,
        regenerate_only: typeof regen === "string" ? regen : null,
        ts: new Date().toISOString(),
      }),
    );
  } catch {
    /* non-fatal */
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();
  const log = createLogger("orchestrate");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawText = await req.text();
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawText || "{}") as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.57.2");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const token = authHeader.replace("Bearer ", "");

    let userId: string;

    if (token === serviceKey) {
      const uid = body.userId;
      if (typeof uid !== "string" || uid.length === 0) {
        return new Response(
          JSON.stringify({ error: "Service calls must include userId in the JSON body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      userId = uid;
      log("auth verified (service role)");
    } else {
      const sbClient = createClient(sbUrl, sbAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await sbClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
      log("auth verified (user JWT)");
    }

    const svcClient = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false },
    });

    logOrchestrateInvoke(body, token === serviceKey ? "service_role" : "user_jwt");

    const regenerateOnly = body.regenerateOnly as string | undefined;
    if (
      regenerateOnly === "signal" ||
      regenerateOnly === "grounding" ||
      regenerateOnly === "history" ||
      regenerateOnly === "zoomOut"
    ) {
      return await handleRegenerateOnly({
        slot: regenerateOnly,
        userId,
        svcClient,
        body,
        log,
      });
    }

    const {
      reflectionId,
      context,
      language = "en",
      reflectionMessage,
      mood,
      signalSources,
      groundingSources,
      recentSignalSources,
      recentSignalTitles,
      recentSignalUrls,
      recentNudgeTopics,
      recentGroundingSources,
      recentHistoryTitles,
      recentZoomOutTitles,
      enableSignal = false,
      enableGrounding = false,
      enableHistory = false,
      enableZoomOut = false,
      useIntervention = true,
    } = body as Record<string, unknown>;

    const moodHistory = body.moodHistory as
      | Array<{ mood: string; outcome?: string | null }>
      | undefined;
    const contextValue = asOptionalString(context);
    const languageValue = asOptionalString(language) ?? "en";
    const reflectionMessageValue = asOptionalString(reflectionMessage);
    const moodValue = asOptionalString(mood);
    const signalSourcesValue = asSourceArray(signalSources);
    const groundingSourcesValue = asSourceArray(groundingSources);
    const recentSignalSourcesValue = asStringArray(recentSignalSources);
    const recentSignalTitlesValue = asStringArray(recentSignalTitles);
    const recentNudgeTopicsValue = asStringArray(recentNudgeTopics);
    const recentGroundingSourcesValue = asStringArray(recentGroundingSources);
    const recentHistoryTitlesValue = asStringArray(recentHistoryTitles);
    const recentZoomOutTitlesValue = asStringArray(recentZoomOutTitles);

    // ── Authorization: ensure reflection ownership ──
    // This function uses the service-role key for writes (RLS bypass), so we must
    // explicitly verify that any provided `reflectionId` belongs to `userId`.
    if (typeof reflectionId === "string" && reflectionId.length > 0) {
      const { data: reflection, error: refErr } = await svcClient
        .from("reflections")
        .select("user_id")
        .eq("id", reflectionId)
        .maybeSingle();

      if (refErr || !reflection || reflection.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Reflection not found" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Determine session intent for coherent companion theming ──
    const intent = determineSessionIntent({
      context: contextValue,
      mood: moodValue,
      severity: typeof body.severity === "number" ? body.severity : undefined,
      moodHistory,
    });
    log(`session intent: ${intent.theme}`, { theme: intent.theme, tone: intent.emotionalTone });

    // ── Intervention selection (new pause flow) ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

    let selection: InterventionSelection | null = null;
    if (useIntervention && reflectionId) {
      const rawSeverity = typeof body.severity === "number" ? body.severity : 0;
      const direction = parseDirection(contextValue);
      const severity = bucketSeverity(rawSeverity);
      log(`selecting intervention: mood=${moodValue} severity=${severity} direction=${direction}`);

      selection = await selectIntervention({
        userId,
        reflectionId: reflectionId as string,
        mood: moodValue,
        severity,
        direction,
        moodHistory,
        svcClient,
      });
      log(`intervention selected: mode=${selection.mode} primary=${selection.primary ?? "none"}`);
    }

    // ── Build the intervention response ──
    const interventionPayload: InterventionPayload = {
      mode: selection?.mode ?? "insight",
      primary: null,
      secondary: null,
      question: null,
    };

    if (selection?.primary === "mirror" && selection.mirrorData) {
      interventionPayload.primary = { type: "mirror", data: selection.mirrorData };
    }

    const insightSelection = selection?.mode === "insight" ? selection : null;
    const interventionNeedsGrounding = insightSelection?.primary === "trap";
    const interventionNeedsHistory = insightSelection?.primary === "pattern";
    const interventionNeedsZoomOut = insightSelection?.secondary === "zoom_out";

    const shouldRunGrounding = Boolean(enableGrounding || interventionNeedsGrounding);
    const shouldRunHistory = Boolean(enableHistory || interventionNeedsHistory);
    const shouldRunZoomOut = Boolean(enableZoomOut || interventionNeedsZoomOut);

    if (interventionNeedsGrounding && !enableGrounding) {
      log("grounding task forced for trap intervention (companion pref off)");
    }
    if (interventionNeedsHistory && !enableHistory) {
      log("history task forced for pattern intervention (companion pref off)");
    }
    if (interventionNeedsZoomOut && !enableZoomOut) {
      log("zoomOut task forced for intervention secondary (companion pref off)");
    }

    const rid = typeof reflectionId === "string" ? reflectionId : "";
    if (rid.length > 0) {
      const skipped = await tryOrchestrateSkipFromReflectionCompanions({
        svcClient,
        reflectionId: rid,
        useIntervention: Boolean(useIntervention),
        needSignal: Boolean(enableSignal),
        needGrounding: shouldRunGrounding,
        needHistory: Boolean(enableHistory),
        needZoomOut: shouldRunZoomOut,
        log,
      });
      if (skipped) {
        return new Response(JSON.stringify(skipped), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Per-user rate limit + daily budget (skipped when serving from reflection_companions) ──
    const rateLimit = await checkRateLimit(svcClient, userId, 60, 30);
    if (!rateLimit.allowed) {
      log(`rate limited: ${rateLimit.reason}`);
      return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const budget = await checkDailyBudget(svcClient, 10.0);
    if (!budget.allowed) {
      log(`budget exceeded: ${budget.reason}`);
      return new Response(JSON.stringify({ error: "Generation budget exceeded for today." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (selection && useIntervention && reflectionId) {
      void svcClient.from("analytics_events").insert({
        user_id: userId,
        event: "intervention_selected",
        metadata: {
          mode: selection.mode,
          primary: selection.primary ?? null,
          secondary: selection.secondary ?? null,
          reflection_id: reflectionId ?? null,
        },
      }).then(({ error: insErr }: { error: { message: string } | null }) => {
        if (insErr) log.error("analytics intervention_selected insert failed", { error: insErr.message });
      });
    }

    let effectiveGroundingSources = groundingSourcesValue;
    if (shouldRunGrounding && (!effectiveGroundingSources || effectiveGroundingSources.length === 0)) {
      effectiveGroundingSources = await fetchGroundingSourcesForOrchestrate(svcClient, userId) ?? undefined;
    }

    const directionForQuestion = parseDirection(contextValue);
    const rawSeverityForQuestion = typeof body.severity === "number" ? body.severity : 0;
    const severityBucketForQuestion = bucketSeverity(rawSeverityForQuestion);
    const questionPromise =
      selection?.mode === "question" && LOVABLE_API_KEY
        ? generateQuestion({
            context: contextValue ?? "",
            mood: moodValue,
            direction: directionForQuestion,
            severity: severityBucketForQuestion,
            moodHistory,
            apiKey: LOVABLE_API_KEY,
            language: languageValue,
          })
        : Promise.resolve<string | null>(null);

    // ── Fire companion generators (prefs and/or intervention headline requirements) ──
    const tasks: Record<string, Promise<CompanionResult>> = {};

    if (shouldRunGrounding) {
      tasks.grounding = (async (): Promise<CompanionResult> => {
        const t = Date.now();
        const result = await generateGrounding({
          svcClient,
          context: contextValue,
          language: languageValue,
          recentTopics: recentNudgeTopicsValue,
          sources: effectiveGroundingSources,
          recentGroundingSources: recentGroundingSourcesValue,
          recentGroundingTitles: recentNudgeTopicsValue,
          userId,
          reflectionId: typeof reflectionId === "string" ? reflectionId : null,
          log,
          preferredBias: intent.groundingBias,
        });
        return {
          data: result.data,
          source: result.source,
          cacheId: result.cacheId,
          latencyMs: Date.now() - t,
          promptVersion: GROUNDING_VERSION,
          error: result.error,
        };
      })();
    }
    if (shouldRunHistory) {
      tasks.history = (async (): Promise<CompanionResult> => {
        const t = Date.now();
        const result = await generateHistory({
          svcClient,
          context: contextValue,
          language: languageValue,
          mood: moodValue,
          recentTitles: recentHistoryTitlesValue,
          userId,
          log,
          preferredMood: intent.historyMood,
        });
        return {
          data: result.data,
          source: result.source,
          cacheId: result.cacheId,
          latencyMs: Date.now() - t,
          promptVersion: HISTORY_VERSION,
          error: result.error,
        };
      })();
    }
    if (shouldRunZoomOut) {
      tasks.zoomOut = (async (): Promise<CompanionResult> => {
        const t = Date.now();
        const result = await generateZoomOut({
          svcClient,
          context: contextValue,
          language: languageValue,
          reflectionMessage: reflectionMessageValue,
          mood: moodValue,
          userId,
          recentTitles: recentZoomOutTitlesValue,
          log,
          zoomOutAngle: intent.zoomOutAngle,
        });
        return {
          data: result.data,
          source: result.source,
          cacheId: result.cacheId,
          latencyMs: Date.now() - t,
          promptVersion: ZOOM_OUT_VERSION,
          error: result.error,
        };
      })();
    }
    // Signal — included in pause flow when enabled; provides market context for cognitive reappraisal
    if (enableSignal) {
      tasks.signal = (async (): Promise<CompanionResult> => {
        const t = Date.now();
        const clientSignalUrls = Array.isArray(recentSignalUrls)
          ? (recentSignalUrls as string[]).filter((u) => typeof u === "string" && u.length > 0)
          : [];
        let mergedRecentSignalUrls: string[] | undefined;
        if (userId) {
          try {
            const fromDb = await fetchRecentSignalCitationUrls(svcClient, userId, {
              excludeReflectionId: typeof reflectionId === "string" ? reflectionId : undefined,
              limit: 24,
            });
            mergedRecentSignalUrls = mergeRecentSignalUrls(fromDb, clientSignalUrls, 24);
            log(
              `signal recent URLs: db=${fromDb.length} client=${clientSignalUrls.length} merged=${mergedRecentSignalUrls?.length ?? 0}`,
            );
          } catch (e) {
            log(`fetchRecentSignalCitationUrls failed: ${e}`);
            mergedRecentSignalUrls = clientSignalUrls.length > 0 ? clientSignalUrls.slice(0, 24) : undefined;
          }
        } else {
          mergedRecentSignalUrls = clientSignalUrls.length > 0 ? clientSignalUrls.slice(0, 24) : undefined;
        }
        const result = await generateSignal({
          svcClient,
          context: contextValue,
          language: languageValue,
          sources: signalSourcesValue,
          recentSignalSources: recentSignalSourcesValue,
          recentSignalTitles: recentSignalTitlesValue,
          recentSignalUrls: mergedRecentSignalUrls,
          userId,
          reflectionId: typeof reflectionId === "string" ? reflectionId : null,
          log,
          searchAngle: intent.signalAngle,
        });
        return {
          data: result.data,
          source: result.source,
          cacheId: result.cacheId,
          latencyMs: Date.now() - t,
          promptVersion: SIGNAL_VERSION,
          error: result.error,
        };
      })();
    }

    // Await all tasks in parallel
    const keys = Object.keys(tasks);
    const [results, resolvedQuestion] = await Promise.all([
      Promise.allSettled(Object.values(tasks)),
      questionPromise,
    ]);

    if (resolvedQuestion !== null) {
      interventionPayload.question = resolvedQuestion;
      if (typeof resolvedQuestion === "string" && resolvedQuestion.length > 0) {
        trackEvent(svcClient, userId, "intervention_question_ai_call");
      }
    }

    const response: OrchestrateResponse = {
      signal: null,
      grounding: null,
      history: null,
      zoomOut: null,
      intervention: null,
    };

    const serveInserts: any[] = [];
    const writePromises: Promise<void>[] = [];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i] as keyof Omit<OrchestrateResponse, "intervention">;
      const result = results[i];

      if (result.status === "fulfilled") {
        response[key] = result.value;

        // Populate intervention payload from task results
        if (selection?.mode === "insight") {
          if (key === "grounding" && selection.primary === "trap") {
            interventionPayload.primary = { type: "trap", data: result.value.data };
          } else if (key === "history" && selection.primary === "pattern") {
            interventionPayload.primary = { type: "pattern", data: result.value.data };
          } else if (key === "zoomOut" && selection.secondary === "zoom_out") {
            interventionPayload.secondary = { type: "zoom_out", data: result.value.data };
          }
        }

        serveInserts.push({
          user_id: userId,
          reflection_id: (reflectionId as string) || null,
          companion_type: companionTypeMap[key],
          serve_source: result.value.source,
          cache_entry_id: result.value.cacheId || null,
          content_title: result.value.data?.title || result.value.data?.deepTime?.title || null,
          content_fingerprint: result.value.promptVersion ?? null,
          latency_ms: result.value.latencyMs,
        });

        // Write companion data to reflection_companions (normalized)
        if (isCompanionContent(result.value.data) && typeof reflectionId === "string" && reflectionId.length > 0) {
          const cType = companionTypeMap[key];
          if (cType) {
            writePromises.push(
              writeCompanionData(svcClient, reflectionId, cType, result.value.data)
            );
          }
        }
      } else {
        // Generator threw — surface as empty with error
        response[key] = {
          data: null,
          source: "empty",
          cacheId: null,
          latencyMs: Date.now() - t0,
          error: result.reason?.message || "Unknown error",
        };
        serveInserts.push({
          user_id: userId,
          reflection_id: (reflectionId as string) || null,
          companion_type: companionTypeMap[key],
          serve_source: "empty",
          cache_entry_id: null,
          content_title: null,
          content_fingerprint: null,
          latency_ms: Date.now() - t0,
        });
      }
    }

    // Attach the intervention payload if intervention selection was used
    if (selection) {
      response.intervention = interventionPayload;

      // Persist intervention to reflection_companions so re-entry restores it
      if (typeof reflectionId === "string" && reflectionId.length > 0) {
        writePromises.push(
          writeCompanionData(svcClient, reflectionId, "intervention", interventionPayload as unknown as Record<string, unknown>)
        );
      }
    }

    // Add serve log writes
    if (serveInserts.length > 0) {
      writePromises.push(
        (async () => {
          const { error } = await svcClient.from("companion_serves").insert(serveInserts);
          if (error) log.error("serve insert error", { error: error.message });
        })()
      );
    }

    // Fire DB writes in the background — do not block the response.
    // allSettled ensures all writes run to completion; errors are logged but
    // don't affect the companion data returned to the client.
    if (writePromises.length > 0) {
      Promise.allSettled(writePromises).then((outcomes) => {
        for (const outcome of outcomes) {
          if (outcome.status === "rejected") {
            log.error("background write failed", { error: String(outcome.reason) });
          }
        }
      });
    }

    log(`done, returning ${keys.length} companions`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("unhandled error", { error: e instanceof Error ? e.message : String(e) });
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// ── Helpers ──

import { ORCHESTRATOR_KEY_MAP } from "../_shared/companion-types.ts";
const companionTypeMap = ORCHESTRATOR_KEY_MAP;

// All companion data is written to the normalized reflection_companions table via writeCompanionData().
