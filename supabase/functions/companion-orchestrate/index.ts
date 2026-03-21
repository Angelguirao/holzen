import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, checkDailyBudget } from "../_shared/ratelimit.ts";
import { createLogger } from "../_shared/observe.ts";

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
        // Sub-function failed entirely — try orchestrator-level curated fallback
        const curatedPool = ORCHESTRATOR_CURATED[key];
        if (curatedPool && curatedPool.length > 0) {
          const pick = curatedPool[Math.floor(Math.random() * curatedPool.length)];
          response[key] = {
            data: pick,
            source: "curated",
            cacheId: null,
            latencyMs: Date.now() - t0,
          };
          serveInserts.push({
            user_id: user.id,
            reflection_id: reflectionId || null,
            companion_type: companionTypeMap[key],
            serve_source: "curated",
            cache_entry_id: null,
            content_title: pick.title || pick.deepTime?.title || null,
            content_fingerprint: null,
            latency_ms: Date.now() - t0,
          });
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
    }

    // Await critical writes before returning response
    const writePromises: Promise<void>[] = [];

    if (serveInserts.length > 0) {
      writePromises.push(
        svcClient.from("companion_serves").insert(serveInserts).then(({ error }) => {
          if (error) log.error("serve insert error", { error: error.message });
        })
      );
    }

    if (reflectionId && Object.keys(reflectionUpdates).length > 0) {
      writePromises.push(
        svcClient.from("reflections").update(reflectionUpdates).eq("id", reflectionId).then(({ error }) => {
          if (error) log.error("reflection update error", { error: error.message });
        })
      );
    }

    // Wait for all writes to complete (with a safety timeout to avoid blocking forever)
    if (writePromises.length > 0) {
      await Promise.race([
        Promise.allSettled(writePromises),
        new Promise(resolve => setTimeout(resolve, 3000)), // 3s max wait for writes
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

// Import canonical companion type map
import { ORCHESTRATOR_KEY_MAP } from "../_shared/companion-types.ts";
const companionTypeMap = ORCHESTRATOR_KEY_MAP;

// ── Orchestrator-level curated fallbacks (last resort if sub-function fails entirely) ──
const ORCHESTRATOR_CURATED: Record<string, any[]> = {
  signal: [
    { title: "Proof of work is proof of sacrifice", body: "Gigi argues that Bitcoin's proof-of-work mechanism mirrors a universal truth: nothing of value comes without cost. The energy expended isn't wasted — it's transformed into trust.", source: "Gigi — 21 Lessons", url: "https://21lessons.com/" },
    { title: "Sound money teaches patience before it teaches wealth", body: "Saifedean Ammous observes that the hardest lesson Bitcoin teaches isn't about returns — it's about time preference. A society that saves in hard money naturally extends its planning horizon.", source: "Saifedean Ammous — The Bitcoin Standard", url: "https://saifedean.com/thebitcoinstandard/" },
  ],
  grounding: [
    { title: "Loss aversion doubles the sting of dropping prices", body: "Kahneman and Tversky's 1979 prospect theory study showed that losses feel roughly twice as painful as equivalent gains feel good. When BTC drops 5%, your brain processes it as if you lost 10%.", citation: "Kahneman & Tversky (1979), Prospect Theory", url: "https://scholar.google.com/scholar?q=kahneman+tversky+prospect+theory+1979" },
    { title: "Your prefrontal cortex goes offline during financial stress", body: "Lo and Repin's 2002 study found that market volatility triggers measurable autonomic nervous system responses that impair the prefrontal cortex's capacity for rational decision-making.", citation: "Lo & Repin (2002), The Psychophysiology of Real-Time Financial Risk Processing", url: "https://scholar.google.com/scholar?q=lo+repin+psychophysiology+financial+risk+2002" },
  ],
  history: [
    { title: "Amazon lost 95% and became the everything store", btcInsight: "From its 1999 peak of $106.69, Amazon crashed to $5.51 by 2001 — a 95% drawdown. Anyone who sold at $5.51 missed a stock that would eventually reach $3,000+.", analogy: "Bitcoin has experienced five drawdowns of 70%+ in its history. Each time, the 'it's dead' narrative peaked at the bottom.", assetClass: "Tech stocks", period: "2000-2001" },
    { title: "The 2020 COVID crash recovered in 40 days", btcInsight: "On March 12, 2020, Bitcoin fell from $7,900 to $3,800 in 24 hours. Yet within 40 days, BTC had recovered to pre-crash levels.", analogy: "The S&P 500 followed a similar pattern, crashing 34% and fully recovering by August 2020.", assetClass: "S&P 500", period: "March 2020" },
  ],
  zoomOut: [
    { deepTime: { title: "Fifteen years in five thousand", body: "Humans have used money for roughly 5,000 years — shells, salt, gold, paper, digits. Bitcoin is 15 years old. You're watching the first chapter of a new monetary epoch." }, onThisDay: [], currentPrice: null, echo: null },
    { deepTime: { title: "Gold took centuries to become gold", body: "For thousands of years, humans carried gold without knowing why it was valuable beyond its beauty. It took until 1717 for Isaac Newton to formally establish the gold standard." }, onThisDay: [], currentPrice: null, echo: null },
  ],
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
