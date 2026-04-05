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
import { ORCHESTRATOR_KEY_MAP } from "../_shared/companion-types.ts";
import type {
  CompanionResult,
  InterventionPayload,
  OrchestrateResponse,
} from "../_shared/companion-orchestrate-types.ts";
import {
  asOptionalString,
  asSourceArray,
  asStringArray,
  isCompanionContent,
} from "../_shared/companion-orchestrate-parse.ts";
import { logOrchestrateInvoke } from "../_shared/companion-orchestrate-logging.ts";
import { tryOrchestrateSkipFromReflectionCompanions } from "../_shared/companion-orchestrate-skip-cached.ts";

const companionTypeMap = ORCHESTRATOR_KEY_MAP;

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
