import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, checkDailyBudget } from "../_shared/ratelimit.ts";
import { createLogger } from "../_shared/observe.ts";
import { writeCompanionData } from "../_shared/companion-data.ts";
import { generateSignal } from "../_shared/generators/signal.ts";
import { generateGrounding } from "../_shared/generators/grounding.ts";
import { generateHistory } from "../_shared/generators/history.ts";
import { generateZoomOut } from "../_shared/generators/zoom-out.ts";
import { determineSessionIntent } from "../_shared/session-intent.ts";

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

interface OrchestrateResponse {
  signal: CompanionResult | null;
  grounding: CompanionResult | null;
  history: CompanionResult | null;
  zoomOut: CompanionResult | null;
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
      // Companion-specific params
      signalSources,
      recentSignalSources,
      recentSignalTitles,
      recentNudgeTopics,
      recentHistoryTitles,
      recentZoomOutTitles,
      // Which companions are enabled
      enableSignal = false,
      enableGrounding = false,
      enableHistory = false,
      enableZoomOut = false,
    } = body;

    log(`companions: signal=${enableSignal} grounding=${enableGrounding} history=${enableHistory} zoomOut=${enableZoomOut}`);

    // ── Determine session intent for coherent companion theming ──
    const moodHistory = body.moodHistory; // Passed from client if available
    const intent = determineSessionIntent({
      context: context ?? undefined,
      mood: mood ?? undefined,
      severity: body.severity,
      moodHistory,
    });
    log(`session intent: ${intent.theme}`, { theme: intent.theme, tone: intent.emotionalTone });

    // ── Fire all enabled companions in parallel via direct generator calls ──
    const tasks: Record<string, Promise<CompanionResult>> = {};

    if (enableSignal) {
      tasks.signal = (async (): Promise<CompanionResult> => {
        const t = Date.now();
        const result = await generateSignal({ svcClient, context, language, sources: signalSources, recentSignalSources, recentSignalTitles, userId: user.id, log, searchAngle: intent.signalAngle });
        return { data: result.data, source: result.source, cacheId: result.cacheId, latencyMs: Date.now() - t };
      })();
    }

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

    // Await all in parallel
    const keys = Object.keys(tasks);
    const results = await Promise.allSettled(Object.values(tasks));

    const response: OrchestrateResponse = {
      signal: null,
      grounding: null,
      history: null,
      zoomOut: null,
    };

    const serveInserts: any[] = [];
    const writePromises: Promise<void>[] = [];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i] as keyof OrchestrateResponse;
      const result = results[i];

      if (result.status === "fulfilled") {
        response[key] = result.value;

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

    // Add serve log writes
    if (serveInserts.length > 0) {
      writePromises.push(
        svcClient.from("companion_serves").insert(serveInserts).then(({ error }: any) => {
          if (error) log.error("serve insert error", { error: error.message });
        })
      );
    }

    // Await all critical writes before returning (with safety timeout)
    if (writePromises.length > 0) {
      await Promise.race([
        Promise.allSettled(writePromises),
        new Promise(resolve => setTimeout(resolve, 5000)), // 5s for companion data + serve logs
      ]);
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
