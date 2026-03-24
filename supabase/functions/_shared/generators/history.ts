/**
 * Reusable historical-insight generation pipeline.
 *
 * Owns: Perplexity search → AI structuring → quality gate → URL post-processing
 *       → cache write → background URL validation → fallback chain.
 *
 * Does NOT own: HTTP handling, auth, CORS, analytics event tracking.
 * API keys are read from Deno.env directly (same as the original function).
 */

import { qualityGate, BANNED_PHRASES, isUrlReachable, contentFingerprint } from "../quality.ts";
import { HISTORY_FALLBACKS, pickRandom } from "../fallbacks.ts";
import { parseMarketDirection, serveFromCache } from "../cache.ts";
import { createAttemptLogger } from "../observe.ts";
import { searchLibrary, eventToHistory } from "../content-library.ts";

// ── Public types ──

export interface HistoryResult {
  data: { title: string; btcInsight: string; analogy: string; assetClass: string; period: string; source?: string; url?: string } | null;
  source: "live" | "cache" | "curated";
  cacheId: string | null;
}

export interface GenerateHistoryParams {
  svcClient: any;
  context?: string;
  language?: string;
  mood?: string;
  recentTitles?: string[];
  userId?: string;
  preferredMood?: "recovery" | "caution" | "neutral";
  log: (msg: string, extra?: Record<string, unknown>) => void;
}

// ── Internals ──

// Eras tagged by emotional resonance for mood-aware selection
interface HistoricalEra {
  era: string;
  examples: string;
  mood: "recovery" | "caution" | "neutral"; // recovery=good for anxious, caution=good for excited
}

const HISTORICAL_ERAS: HistoricalEra[] = [
  // Recovery stories — best for anxious/fearful users (show that crashes end)
  { era: "COVID and institutional era (2020-2021)", examples: "March 2020 crash recovered in 40 days, MicroStrategy buys, El Salvador adoption, $69k peak", mood: "recovery" },
  { era: "tech stock parallels", examples: "Amazon's 95% crash then becoming a trillion-dollar company, Apple near-bankruptcy then iPhone revolution", mood: "recovery" },
  { era: "early Bitcoin (2011-2013)", examples: "Bitcoin's crash from $32 to $2 then recovery to $1,000+, the 2013 China ban crash and recovery", mood: "recovery" },

  // Cautionary tales — best for excited/greedy users (show that euphoria precedes crashes)
  { era: "2017 mania and aftermath (2017-2018)", examples: "Bitcoin's rise to $20k driven by hype, the painful 2018 bear market, speculative excess", mood: "caution" },
  { era: "traditional finance bubbles", examples: "1987 Black Monday, dot-com bubble 2000, 2008 financial crisis, gold's 1980 peak and 20-year decline", mood: "caution" },

  // Neutral — good for calm users or when mood is unknown
  { era: "Mt. Gox era (2014-2015)", examples: "Mt. Gox collapse, the long Bitcoin bear market of 2014-2015, survival of the protocol", mood: "neutral" },
  { era: "Bitcoin bear market (2022-2023)", examples: "Industry contagion from Luna/Terra and FTX failures, Bitcoin's resilience and recovery", mood: "neutral" },
  { era: "commodity and forex history", examples: "oil price shocks, Swiss franc unpegging 2015, Asian financial crisis 1997", mood: "neutral" },
];

/** Select a historical era that matches the user's emotional state */
function selectEra(
  mood: string | undefined,
  recentTitles: string[] | undefined,
  preferredMood?: "recovery" | "caution" | "neutral",
): HistoricalEra {
  const recentSet = new Set((recentTitles || []).map(t => t.toLowerCase()));

  // Mood-aware filtering
  let preferred: HistoricalEra[];
  if (preferredMood) {
    preferred = HISTORICAL_ERAS.filter(e => e.mood === preferredMood);
    if (preferred.length === 0) preferred = HISTORICAL_ERAS;
  } else if (mood === "anxious" || mood === "fearful") {
    preferred = HISTORICAL_ERAS.filter(e => e.mood === "recovery");
  } else if (mood === "excited" || mood === "fomo" || mood === "greedy") {
    preferred = HISTORICAL_ERAS.filter(e => e.mood === "caution");
  } else {
    preferred = HISTORICAL_ERAS; // Any era for calm/neutral
  }

  // Filter out recently shown eras
  const available = preferred.filter(e =>
    !recentSet.has(e.era.toLowerCase()) &&
    !Array.from(recentSet).some(t => e.era.toLowerCase().includes(t) || t.includes(e.era.toLowerCase()))
  );

  const pool = available.length > 0 ? available : preferred.length > 0 ? preferred : HISTORICAL_ERAS;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function serveFallback(
  svcClient: any,
  userId?: string,
  marketDirection?: "up" | "down" | "neutral",
  excludeIds?: string[],
): Promise<HistoryResult> {
  const cached = await serveFromCache(svcClient, "historical_insight", "en", { userId, marketDirection, excludeIds });
  if (cached) return { data: cached.data, source: "cache", cacheId: cached.cacheId };
  return { data: pickRandom(HISTORY_FALLBACKS), source: "curated", cacheId: null };
}

async function callPerplexity(
  pBody: any,
  apiKey: string,
  log: GenerateHistoryParams["log"],
): Promise<{ content: string; citations: string[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(pBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    log(`perplexity responded ${res.status}`);
    if (!res.ok) {
      const errText = await res.text();
      console.error("Perplexity error:", res.status, errText);
      if (res.status === 429) throw new Error("RATE_LIMITED");
      throw new Error(`Perplexity ${res.status}`);
    }
    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      citations: data.citations || [],
    };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// ── Public entry point ──

export async function generateHistory(params: GenerateHistoryParams): Promise<HistoryResult> {
  const { svcClient, context, mood, recentTitles, userId, preferredMood, log } = params;
  const marketDirection = parseMarketDirection(context);

  const logAttempt = createAttemptLogger(svcClient, { userId });

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
    log("missing API keys, serving fallback");
    return serveFallback(svcClient, userId, marketDirection);
  }

  const marketContext = context || "Bitcoin market movement";
  const moodContext = mood ? `The user is currently feeling "${mood}".` : "";
  const titleExclusion = (recentTitles && Array.isArray(recentTitles) && recentTitles.length > 0)
    ? `\nDo NOT cover these topics (already shown recently): ${recentTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT historical event.`
    : "";
  const randomEra = selectEra(mood, recentTitles, preferredMood);

  const historyMoodTag: string | undefined =
    preferredMood ??
    (mood === "anxious" || mood === "fearful"
      ? "recovery"
      : mood === "excited" || mood === "fomo" || mood === "greedy"
        ? "caution"
        : undefined);

  // ── Try local content library first ──
  const libraryResults = await searchLibrary(svcClient, {
    type: "event",
    companionType: "historical_insight",
    moodTag: historyMoodTag,
    excludeTitles: recentTitles,
    limit: 3,
  });

  if (libraryResults.length > 0) {
    const pick = libraryResults[0];
    const result = eventToHistory(pick);
    log(`served from content library: "${pick.title}"`);
    const citations = pick.url ? [pick.url] : [];
    const qualityScore = 1;
    const cacheQg = qualityGate("historical_insight", result);
    if (result.title && result.btcInsight && cacheQg.pass) {
      try {
        const { data: existing } = await svcClient.from("companion_cache").select("content").eq("companion_type", "historical_insight").eq("language", "en").limit(30);
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
        const newNorm = norm(result.title);
        const isDup = existing?.some((e: any) => {
          const t = norm(e.content?.title || "");
          return t === newNorm || t.includes(newNorm) || newNorm.includes(t);
        });
        if (!isDup) {
          let sourceHost = "";
          try { sourceHost = result.url ? new URL(result.url.startsWith("http") ? result.url : `https://${result.url}`).hostname.replace(/^www\./, "") : ""; } catch { /* ignore */ }
          const fingerprint = await contentFingerprint(newNorm);
          const { error: cacheErr } = await svcClient.from("companion_cache").insert({
            companion_type: "historical_insight",
            language: "en",
            content: result,
            quality_score: qualityScore,
            title: result.title,
            title_norm: newNorm,
            fingerprint,
            source_kind: "historical_event",
            source_title: result.source || null,
            source_author: null,
            source_url: result.url || null,
            source_host: sourceHost || null,
            citations: citations.length > 0 ? JSON.stringify(citations) : null,
            market_regime: parseMarketDirection(context),
            expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
            last_validated_at: qualityScore >= 2 ? new Date().toISOString() : null,
            automated_score: qualityScore,
          });
          if (cacheErr) log(`cache insert error: ${cacheErr.message}`);
        } else {
          log("cache dedup: skipped duplicate title");
        }
      } catch (e) {
        log(`cache write failed: ${e}`);
      }
    }
    if (result.url && result.url.startsWith("http")) {
      isUrlReachable(result.url).then(async (reachable) => {
        if (reachable) {
          try {
            const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
            await svcClient.from("companion_cache")
              .update({ quality_score: 2, last_validated_at: new Date().toISOString() })
              .eq("companion_type", "historical_insight")
              .eq("title_norm", norm(result.title));
          } catch { /* non-critical */ }
        } else {
          log("background URL validation failed", { url: result.url });
        }
      }).catch(() => {});
    }
    return { data: result, source: "live", cacheId: null };
  }

  // ── No local match — fall through to Perplexity ──

  // ── Step 1: Perplexity search ──
  log("calling perplexity");
  let searchContent = "";
  let citations: string[] = [];

  try {
    const result = await callPerplexity({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: `You are a financial historian specializing in ${randomEra.era}. Search for ONE specific historical event with exact dates, prices, and percentage moves. Do NOT give a general overview — find a specific incident. Include what happened afterward (recovery timeline). Draw from: ${randomEra.examples}. Be precise with numbers.${titleExclusion}`,
        },
        { role: "user", content: `Find a specific historical financial event from ${randomEra.era} that parallels current Bitcoin conditions: ${marketContext}. ${moodContext} Include exact dates, prices, percentage moves, and what happened after.` },
      ],
    }, PERPLEXITY_API_KEY, log);
    searchContent = result.content;
    citations = result.citations;
    log(`content length: ${searchContent.length}, citations: ${citations.length}`);
  } catch (e) {
    log(`perplexity failed: ${e}`);
    logAttempt({ companion_type: "historical_insight", provider: "perplexity", model: "sonar-pro", status: String(e).includes("RATE_LIMITED") ? "rate_limited" : "error", latency_ms: 0, error_message: String(e) });
    return serveFallback(svcClient, userId, marketDirection);
  }

  if (!searchContent) {
    logAttempt({ companion_type: "historical_insight", provider: "perplexity", model: "sonar-pro", status: "error", latency_ms: 0, error_message: "empty_search_content" });
    return serveFallback(svcClient, userId, marketDirection);
  }

  // ── Step 2: AI structuring ──
  log("calling AI structuring");
  const aiBody = {
    response_format: { type: "json_object" },
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are a financial historian for a Bitcoin mindfulness app. Extract ONE historical insight with a cross-asset analogy.

Return a JSON object with these keys:
- "title": Short evocative title specific to the event (NOT generic like "Market Volatility")
- "btcInsight": 2-3 sentences about the specific event with real dates/numbers
- "analogy": 1-2 sentences drawing a parallel from another asset class
- "assetClass": The other asset class (e.g. "Gold", "Tech stocks")
- "period": Historical period (e.g. "January 2015")
- "recovery": 1 sentence about what happened months/years later (e.g. "Within 18 months, the index had fully recovered and set new highs")
- "source": Source name
- "url": URL from citations

ACCURACY RULES (CRITICAL):
- Use ONLY dates, prices, percentages from the search results
- Do NOT invent historical prices or recovery timelines
- End with "this too passed" energy, not hype or doom

BITCOIN ONLY:
- The analogy must connect back to Bitcoin specifically, not "crypto" in general
- Say "Bitcoin" not "crypto", "cryptocurrency", or "digital assets"
- The user is a Bitcoin holder — not a "crypto investor"

BANNED PHRASES — NEVER use any of these: ${BANNED_PHRASES.join(", ")}${mood ? `\n\nUSER MOOD: The user is feeling "${mood}". Subtly calibrate the historical parallel to resonate with this emotional state.` : ""}${titleExclusion}`,
      },
      {
        role: "user",
        content: `Market context: ${marketContext}\n\nSearch results:\n${searchContent}\n\nCitation URLs:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}`,
      },
    ],
  };

  const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
  let insight: any = null;

  const AI_TIMEOUTS = [8000, 6000];
  for (let idx = 0; idx < models.length; idx++) {
    const model = models[idx];
    const aiController = new AbortController();
    const aiTimeout = setTimeout(() => aiController.abort(), AI_TIMEOUTS[idx]);
    const attemptT0 = Date.now();
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...aiBody, model }),
        signal: aiController.signal,
      });
      clearTimeout(aiTimeout);
      log(`AI ${model} responded ${res.status}`);

      if (!res.ok) {
        await res.text();
        logAttempt({ companion_type: "historical_insight", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: `HTTP ${res.status}` });
        if (model !== models[models.length - 1]) continue; break;
      }

      const data = await res.json();
      const usage = data.usage;
      const raw = data.choices?.[0]?.message?.content || "";
      try {
        insight = JSON.parse(raw);
      } catch {
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) insight = JSON.parse(m[0]);
        else {
          logAttempt({ companion_type: "historical_insight", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: "json_parse_failed", input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
          if (model !== models[models.length - 1]) continue; else break;
        }
      }
      logAttempt({ companion_type: "historical_insight", provider: "lovable", model, status: "success", latency_ms: Date.now() - attemptT0, input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
      break;
    } catch (e) {
      clearTimeout(aiTimeout);
      logAttempt({ companion_type: "historical_insight", provider: "lovable", model, status: e instanceof DOMException && e.name === "AbortError" ? "timeout" : "error", latency_ms: Date.now() - attemptT0, error_message: String(e) });
      if (model !== models[models.length - 1]) { log(`${model} failed, retrying`); continue; }
      break;
    }
  }

  // ── Step 3: Quality gate ──
  const qg = qualityGate("historical_insight", insight);
  if (!insight || !qg.pass) {
    log(`quality gate failed: ${!insight ? "no insight" : (qg.reason ?? "unknown")}`);
    return serveFallback(svcClient, userId, marketDirection);
  }

  // ── Step 4: URL post-processing ──
  if (citations.length > 0 && !citations.includes(insight.url)) {
    insight.url = citations[0];
  }

  // ── Step 5: Cache write ──
  const qualityScore = 1;
  if (insight.title && insight.btcInsight && qg.pass) {
    try {
      const { data: existing } = await svcClient.from("companion_cache").select("content").eq("companion_type", "historical_insight").eq("language", "en").limit(30);
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      const newNorm = norm(insight.title);
      const isDup = existing?.some((e: any) => {
        const t = norm(e.content?.title || "");
        return t === newNorm || t.includes(newNorm) || newNorm.includes(t);
      });
      if (!isDup) {
        let sourceHost = "";
        try { sourceHost = insight.url ? new URL(insight.url.startsWith("http") ? insight.url : `https://${insight.url}`).hostname.replace(/^www\./, "") : ""; } catch { /* ignore */ }
        const fingerprint = await contentFingerprint(newNorm);
        const { error: cacheErr } = await svcClient.from("companion_cache").insert({
          companion_type: "historical_insight",
          language: "en",
          content: insight,
          quality_score: qualityScore,
          title: insight.title,
          title_norm: newNorm,
          fingerprint,
          source_kind: "historical_event",
          source_title: insight.source || null,
          source_author: null,
          source_url: insight.url || null,
          source_host: sourceHost || null,
          citations: citations.length > 0 ? JSON.stringify(citations) : null,
          market_regime: parseMarketDirection(context),
          expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
          last_validated_at: qualityScore >= 2 ? new Date().toISOString() : null,
          automated_score: qualityScore,
        });
        if (cacheErr) log(`cache insert error: ${cacheErr.message}`);
      } else {
        log("cache dedup: skipped duplicate title");
      }
    } catch (e) {
      log(`cache write failed: ${e}`);
    }
  }

  // ── Step 6: Background URL validation (fire-and-forget) ──
  if (insight.url && insight.url.startsWith("http")) {
    isUrlReachable(insight.url).then(async (reachable) => {
      if (reachable) {
        try {
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
          await svcClient.from("companion_cache")
            .update({ quality_score: 2, last_validated_at: new Date().toISOString() })
            .eq("companion_type", "historical_insight")
            .eq("title_norm", norm(insight.title));
        } catch { /* non-critical */ }
      } else {
        log("background URL validation failed", { url: insight.url });
      }
    }).catch(() => {});
  }

  return { data: insight, source: "live", cacheId: null };
}
