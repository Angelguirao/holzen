import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Companion Orchestrator
 *
 * Single entry point that fires all enabled companion requests in parallel,
 * writes results back to the reflections row, logs companion_serves and
 * generation_attempts, and returns a unified response.
 *
 * This keeps the existing companion edge functions as the generation engines
 * but centralises fallback tracking, serve logging, and reflection write-back.
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
  const log = (msg: string) => console.log(`[orchestrate] ${msg} (+${Date.now() - t0}ms)`);

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

    // ── Fire all enabled companions in parallel via internal function calls ──
    const functionsUrl = sbUrl.replace(/\/$/, "") + "/functions/v1";
    const internalHeaders = {
      Authorization: authHeader,
      "Content-Type": "application/json",
    };

    const tasks: Record<string, Promise<CompanionResult>> = {};

    if (enableSignal) {
      tasks.signal = callCompanion("signal-companion", {
        context,
        language,
        sources: signalSources,
        recentSignalSources,
        recentSignalTitles,
      }, functionsUrl, internalHeaders, log);
    }

    if (enableGrounding) {
      tasks.grounding = callCompanion("ground-nudge", {
        context,
        language,
        recentTopics: recentNudgeTopics,
      }, functionsUrl, internalHeaders, log);
    }

    if (enableHistory) {
      tasks.history = callCompanion("historical-insight", {
        context,
        language,
        mood,
        recentTitles: recentHistoryTitles,
      }, functionsUrl, internalHeaders, log);
    }

    if (enableZoomOut) {
      tasks.zoomOut = callCompanion("zoom-out-companion", {
        context,
        language,
        reflectionMessage,
        mood,
        recentTitles: recentZoomOutTitles,
      }, functionsUrl, internalHeaders, log);
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
    const reflectionUpdates: Record<string, any> = {};

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i] as keyof OrchestrateResponse;
      const result = results[i];

      if (result.status === "fulfilled") {
        response[key] = result.value;

        // Build serve log entry
        serveInserts.push({
          user_id: user.id,
          reflection_id: reflectionId || null,
          companion_type: companionTypeMap[key],
          serve_source: result.value.source,
          cache_entry_id: result.value.cacheId || null,
          content_title: result.value.data?.title || result.value.data?.deepTime?.title || null,
          content_fingerprint: null, // TODO: add fingerprinting later
          latency_ms: result.value.latencyMs,
        });

        // Build reflection write-back
        if (result.value.data && reflectionId) {
          const updates = buildReflectionUpdate(key, result.value.data);
          Object.assign(reflectionUpdates, updates);
        }
      } else {
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

    // Fire-and-forget: write serve logs + reflection updates
    if (serveInserts.length > 0) {
      svcClient.from("companion_serves").insert(serveInserts).then(({ error }) => {
        if (error) console.error("[orchestrate] serve insert error:", error.message);
      });
    }

    if (reflectionId && Object.keys(reflectionUpdates).length > 0) {
      svcClient.from("reflections").update(reflectionUpdates).eq("id", reflectionId).then(({ error }) => {
        if (error) console.error("[orchestrate] reflection update error:", error.message);
      });
    }

    log(`done, returning ${keys.length} companions`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[orchestrate] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// ── Helpers ──

const companionTypeMap: Record<string, string> = {
  signal: "signal",
  grounding: "ground_nudge",
  history: "historical_insight",
  zoomOut: "zoom_out",
};

async function callCompanion(
  functionName: string,
  body: any,
  functionsUrl: string,
  headers: Record<string, string>,
  log: (msg: string) => void,
): Promise<CompanionResult> {
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22000); // 22s hard limit per companion

    const res = await fetch(`${functionsUrl}/${functionName}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - t0;
    log(`${functionName} responded ${res.status} in ${latencyMs}ms`);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { data: null, source: "empty", cacheId: null, latencyMs, error: `${res.status}: ${errText}` };
    }

    const data = await res.json();

    if (data.error) {
      return { data: null, source: "empty", cacheId: null, latencyMs, error: data.error };
    }

    // Determine source from response
    const cacheId = data._cache_id || null;
    // If _cache_id present, it came from cache; otherwise live
    // The individual functions already handle fallback internally
    const source = data._serve_source || (cacheId ? "cache" : "live");

    // Strip internal metadata
    const cleanData = { ...data };
    delete cleanData._cache_id;
    delete cleanData._serve_source;

    return { data: cleanData, source, cacheId, latencyMs };
  } catch (e) {
    const latencyMs = Date.now() - t0;
    const isTimeout = e instanceof DOMException && e.name === "AbortError";
    log(`${functionName} ${isTimeout ? "timed out" : "failed"}: ${e}`);
    return { data: null, source: "empty", cacheId: null, latencyMs, error: isTimeout ? "timeout" : String(e) };
  }
}

function buildReflectionUpdate(key: string, data: any): Record<string, any> {
  switch (key) {
    case "signal":
      return {
        signal_title: data.title || null,
        signal_body: data.body || null,
        signal_source: data.source || null,
        signal_url: data.url || null,
      };
    case "grounding":
      return {
        learning_title: data.title || null,
        learning_body: data.body || null,
        learning_citation: data.citation || null,
        learning_url: data.url || null,
      };
    case "history":
      return {
        history_insight_data: data,
      };
    case "zoomOut":
      return {
        zoom_out_data: data,
      };
    default:
      return {};
  }
}
