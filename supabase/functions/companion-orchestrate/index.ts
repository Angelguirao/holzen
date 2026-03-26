import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, checkDailyBudget } from "../_shared/ratelimit.ts";
import { createLogger } from "../_shared/observe.ts";
import { writeCompanionData } from "../_shared/companion-data.ts";
import { generateSignal } from "../_shared/generators/signal.ts";
import { generateGrounding } from "../_shared/generators/grounding.ts";
import { generateHistory } from "../_shared/generators/history.ts";
import { generateZoomOut } from "../_shared/generators/zoom-out.ts";
import { generateQuestion } from "../_shared/generators/question.ts";
import { determineSessionIntent } from "../_shared/session-intent.ts";
import { selectIntervention, parseDirection, bucketSeverity, type InterventionSelection } from "../_shared/intervention-selector.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Companion Orchestrator
 *
 * Single entry point that fires all enabled companion generators in parallel,
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

    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
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
    log("auth verified");

    const svcClient = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false },
    });

    // ── Per-user rate limit check ──
    const rateLimit = await checkRateLimit(svcClient, user.id, 60, 30);
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

    const body = await req.json();
    const {
      reflectionId,
      context,
      language = "en",
      reflectionMessage,
      mood,
      // Companion-specific params (kept for legacy callers and signal/learn system)
      signalSources,
      recentSignalSources,
      recentSignalTitles,
      recentNudgeTopics,
      recentHistoryTitles,
      recentZoomOutTitles,
      // Legacy enable flags (only used when intervention=false is explicitly set)
      enableSignal = false,
      enableGrounding = false,
      enableHistory = false,
      enableZoomOut = false,
      // New: set to false to bypass intervention selection (for non-pause callers)
      useIntervention = true,
    } = body;

    const moodHistory = body.moodHistory;

    // ── Determine session intent for coherent companion theming ──
    const intent = determineSessionIntent({
      context: context ?? undefined,
      mood: mood ?? undefined,
      severity: body.severity,
      moodHistory,
    });
    log(`session intent: ${intent.theme}`, { theme: intent.theme, tone: intent.emotionalTone });

    // ── Intervention selection (new pause flow) ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

    let selection: InterventionSelection | null = null;
    if (useIntervention && reflectionId) {
      const rawSeverity = typeof body.severity === "number" ? body.severity : 0;
      const direction = parseDirection(context);
      const severity = bucketSeverity(rawSeverity);
      log(`selecting intervention: mood=${mood} severity=${severity} direction=${direction}`);

      selection = await selectIntervention({
        userId: user.id,
        reflectionId,
        mood: mood ?? undefined,
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

    // ── Fire only the selected companion(s) ──
    const tasks: Record<string, Promise<CompanionResult>> = {};

    if (selection) {
      if (selection.mode === "question") {
        // Question Mode: generate a single dynamic question, skip all generators
        const question = await generateQuestion({
          context: context ?? "",
          mood: mood ?? undefined,
          direction: parseDirection(context),
          severity: bucketSeverity(typeof body.severity === "number" ? body.severity : 0),
          moodHistory,
          apiKey: LOVABLE_API_KEY,
          language,
        });
        interventionPayload.question = question;
      } else {
        // Insight Mode: generate only the selected primary (and optional secondary)
        if (selection.primary === "mirror" && selection.mirrorData) {
          // Mirror data was pre-fetched in selectIntervention — no generator call needed
          interventionPayload.primary = { type: "mirror", data: selection.mirrorData };
        } else if (selection.primary === "trap") {
          tasks.grounding = (async (): Promise<CompanionResult> => {
            const t = Date.now();
            const result = await generateGrounding({ svcClient, context, language, recentTopics: recentNudgeTopics, userId: user.id, log, preferredBias: intent.groundingBias });
            return { data: result.data, source: result.source, cacheId: result.cacheId, latencyMs: Date.now() - t };
          })();
        } else if (selection.primary === "pattern") {
          tasks.history = (async (): Promise<CompanionResult> => {
            const t = Date.now();
            const result = await generateHistory({ svcClient, context, language, mood, recentTitles: recentHistoryTitles, userId: user.id, log, preferredMood: intent.historyMood });
            return { data: result.data, source: result.source, cacheId: result.cacheId, latencyMs: Date.now() - t };
          })();
        }

        if (selection.secondary === "zoom_out") {
          tasks.zoomOut = (async (): Promise<CompanionResult> => {
            const t = Date.now();
            const result = await generateZoomOut({ svcClient, context, language, reflectionMessage, mood, userId: user.id, recentTitles: recentZoomOutTitles, log, zoomOutAngle: intent.zoomOutAngle });
            return { data: result.data, source: result.source, cacheId: result.cacheId, latencyMs: Date.now() - t };
          })();
        }
      }
    } else {
      // Legacy path: caller opted out of intervention selection (useIntervention=false)
      // Signal is intentionally excluded from the pause flow — preserved for Learn system only
      if (enableGrounding) {
        tasks.grounding = (async (): Promise<CompanionResult> => {
          const t = Date.now();
          const result = await generateGrounding({ svcClient, context, language, recentTopics: recentNudgeTopics, userId: user.id, log, preferredBias: intent.groundingBias });
          return { data: result.data, source: result.source, cacheId: result.cacheId, latencyMs: Date.now() - t };
        })();
      }
      if (enableHistory) {
        tasks.history = (async (): Promise<CompanionResult> => {
          const t = Date.now();
          const result = await generateHistory({ svcClient, context, language, mood, recentTitles: recentHistoryTitles, userId: user.id, log, preferredMood: intent.historyMood });
          return { data: result.data, source: result.source, cacheId: result.cacheId, latencyMs: Date.now() - t };
        })();
      }
      if (enableZoomOut) {
        tasks.zoomOut = (async (): Promise<CompanionResult> => {
          const t = Date.now();
          const result = await generateZoomOut({ svcClient, context, language, reflectionMessage, mood, userId: user.id, recentTitles: recentZoomOutTitles, log, zoomOutAngle: intent.zoomOutAngle });
          return { data: result.data, source: result.source, cacheId: result.cacheId, latencyMs: Date.now() - t };
        })();
      }
      // Signal — only for explicit Learn system calls (enableSignal=true, useIntervention=false)
      if (enableSignal) {
        tasks.signal = (async (): Promise<CompanionResult> => {
          const t = Date.now();
          const result = await generateSignal({ svcClient, context, language, sources: signalSources, recentSignalSources, recentSignalTitles, userId: user.id, log, searchAngle: intent.signalAngle });
          return { data: result.data, source: result.source, cacheId: result.cacheId, latencyMs: Date.now() - t };
        })();
      }
    }
    // Signal — only for explicit Learn system calls (enableSignal=true, useIntervention=false)
    if (enableSignal && !useIntervention) {
      tasks.signal = (async (): Promise<CompanionResult> => {
        const t = Date.now();
        const result = await generateSignal({ svcClient, context, language, sources: signalSources, recentSignalSources, recentSignalTitles, userId: user.id, log, searchAngle: intent.signalAngle });
        return { data: result.data, source: result.source, cacheId: result.cacheId, latencyMs: Date.now() - t };
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
          user_id: user.id,
          reflection_id: reflectionId || null,
          companion_type: companionTypeMap[key],
          serve_source: result.value.source,
          cache_entry_id: result.value.cacheId || null,
          content_title: result.value.data?.title || result.value.data?.deepTime?.title || null,
          content_fingerprint: null,
          latency_ms: result.value.latencyMs,
        });

        // Write companion data to both new join table and old denormalized columns
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
          user_id: user.id,
          reflection_id: reflectionId || null,
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

// buildReflectionUpdate removed — replaced by writeCompanionData() from companion-data.ts
// which dual-writes to both the new reflection_companions table and old denormalized columns.
