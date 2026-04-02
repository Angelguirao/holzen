import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, checkDailyBudget } from "../_shared/ratelimit.ts";
import { handleRegenerateOnly } from "../_shared/regenerate-only.ts";
import { createLogger } from "../_shared/observe.ts";
import { writeCompanionData } from "../_shared/companion-data.ts";
import { generateSignal, PROMPT_VERSION as SIGNAL_VERSION } from "../_shared/generators/signal.ts";
import { generateGrounding, PROMPT_VERSION as GROUNDING_VERSION } from "../_shared/generators/grounding.ts";
import { generateHistory, PROMPT_VERSION as HISTORY_VERSION } from "../_shared/generators/history.ts";
import { generateZoomOut, PROMPT_VERSION as ZOOM_OUT_VERSION } from "../_shared/generators/zoom-out.ts";
import { generateQuestion } from "../_shared/generators/question.ts";
import { determineSessionIntent } from "../_shared/session-intent.ts";
import { selectIntervention, parseDirection, bucketSeverity, type InterventionSelection } from "../_shared/intervention-selector.ts";
import { fetchGroundingSourcesForOrchestrate } from "../_shared/pause-cron-parity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Companion Orchestrator
 *
 * Single entry point that fires companion generators in parallel — user **enable***
 * flags **or** intervention requirements (trap → grounding, pattern → history,
 * zoom_out secondary → zoom out) determine which tasks run.
 * writes results back to the reflections row, logs companion_serves and
 * generation_attempts, and returns a unified response.
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

    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
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

    // ── Per-user rate limit check ──
    const rateLimit = await checkRateLimit(svcClient, userId, 60, 30);
    if (!rateLimit.allowed) {
      log(`rate limited: ${rateLimit.reason}`);
      return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Daily budget check ──
    const budget = await checkDailyBudget(svcClient, 10.0);
    if (!budget.allowed) {
      log(`budget exceeded: ${budget.reason}`);
      return new Response(JSON.stringify({ error: "Generation budget exceeded for today." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      context: (context as string | undefined) ?? undefined,
      mood: (mood as string | undefined) ?? undefined,
      severity: typeof body.severity === "number" ? body.severity : undefined,
      moodHistory,
    });
    log(`session intent: ${intent.theme}`, { theme: intent.theme, tone: intent.emotionalTone });

    // ── Intervention selection (new pause flow) ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

    let selection: InterventionSelection | null = null;
    if (useIntervention && reflectionId) {
      const rawSeverity = typeof body.severity === "number" ? body.severity : 0;
      const direction = parseDirection(context as string | undefined);
      const severity = bucketSeverity(rawSeverity);
      log(`selecting intervention: mood=${mood} severity=${severity} direction=${direction}`);

      selection = await selectIntervention({
        userId,
        reflectionId: reflectionId as string,
        mood: (mood as string | undefined) ?? undefined,
        severity,
        direction,
        moodHistory,
        svcClient,
      });
      log(`intervention selected: mode=${selection.mode} primary=${selection.primary ?? "none"}`);
      // Track which intervention type is being served — critical for outcome analysis
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

    const directionForQuestion = parseDirection(context as string | undefined);
    const rawSeverityForQuestion = typeof body.severity === "number" ? body.severity : 0;
    const severityBucketForQuestion = bucketSeverity(rawSeverityForQuestion);

    const questionPromise =
      selection?.mode === "question" && LOVABLE_API_KEY
        ? generateQuestion({
            context: (context as string) ?? "",
            mood: (mood as string | undefined) ?? undefined,
            direction: directionForQuestion,
            severity: severityBucketForQuestion,
            moodHistory,
            apiKey: LOVABLE_API_KEY,
            language: (language as string) || "en",
          })
        : Promise.resolve<string | null>(null);

    const insightSelection = selection?.mode === "insight" ? selection : null;
    const interventionNeedsGrounding = insightSelection?.primary === "trap";
    const interventionNeedsHistory = insightSelection?.primary === "pattern";
    const interventionNeedsZoomOut = insightSelection?.secondary === "zoom_out";

    const shouldRunGrounding = Boolean(enableGrounding || interventionNeedsGrounding);
    const shouldRunHistory = Boolean(enableHistory || interventionNeedsHistory);
    const shouldRunZoomOut = Boolean(enableZoomOut || interventionNeedsZoomOut);

    let effectiveGroundingSources = groundingSources as Array<{ name: string; type: string; url?: string }> | undefined;
    if (shouldRunGrounding && (!effectiveGroundingSources || effectiveGroundingSources.length === 0)) {
      effectiveGroundingSources = await fetchGroundingSourcesForOrchestrate(svcClient, userId) ?? undefined;
    }

    if (interventionNeedsGrounding && !enableGrounding) {
      log("grounding task forced for trap intervention (companion pref off)");
    }
    if (interventionNeedsHistory && !enableHistory) {
      log("history task forced for pattern intervention (companion pref off)");
    }
    if (interventionNeedsZoomOut && !enableZoomOut) {
      log("zoomOut task forced for intervention secondary (companion pref off)");
    }

    // ── Fire companion generators (prefs and/or intervention headline requirements) ──
    const tasks: Record<string, Promise<CompanionResult>> = {};

    if (shouldRunGrounding) {
      tasks.grounding = (async (): Promise<CompanionResult> => {
        const t = Date.now();
        const result = await generateGrounding({
          svcClient,
          context,
          language,
          recentTopics: recentNudgeTopics as string[] | undefined,
          sources: effectiveGroundingSources,
          recentGroundingSources: recentGroundingSources as string[] | undefined,
          recentGroundingTitles: recentNudgeTopics as string[] | undefined,
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
    if (enableHistory) {
      tasks.history = (async (): Promise<CompanionResult> => {
        const t = Date.now();
        const result = await generateHistory({ svcClient, context, language, mood, recentTitles: recentHistoryTitles, userId, log, preferredMood: intent.historyMood });
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
        const result = await generateZoomOut({ svcClient, context, language, reflectionMessage, mood, userId, recentTitles: recentZoomOutTitles, log, zoomOutAngle: intent.zoomOutAngle });
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
        const result = await generateSignal({
          svcClient,
          context,
          language,
          sources: signalSources,
          recentSignalSources,
          recentSignalTitles,
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
        if (result.value.data && reflectionId) {
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
      if (reflectionId) {
        writePromises.push(
          writeCompanionData(svcClient, reflectionId as string, "intervention", interventionPayload as any)
        );
      }
    }

    // Add serve log writes
    if (serveInserts.length > 0) {
      writePromises.push(
        svcClient.from("companion_serves").insert(serveInserts).then(({ error }: any) => {
          if (error) log.error("serve insert error", { error: error.message });
        })
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
