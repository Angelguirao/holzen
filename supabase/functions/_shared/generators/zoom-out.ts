/**
 * Reusable zoom-out generation pipeline.
 *
 * Owns: CoinGecko price fetching (with btc_price_cache DB caching)
 *       → echo reflection fetch → AI deep-time generation (with model fallback)
 *       → quality gate → cache write → cache fallback → curated fallback
 *       → response assembly.
 *
 * Does NOT own: HTTP handling, auth, CORS, analytics event tracking.
 * API keys are read from Deno.env directly (same as the original function).
 */

import {
  qualityGate,
  BANNED_PHRASES,
  containsSlop,
  contentFingerprint,
  logQualityGateStructuredReject,
} from "../quality.ts";
import {
  companionFallbacksDisabled,
  COMPANION_FALLBACKS_DISABLED_MESSAGE,
  loadFallbackPool,
  pickRandom,
} from "../fallbacks.ts";
import { COMPANION_ZOOM_OUT_DEEP_TIME, parseMarketDirection, serveFromCache } from "../cache.ts";
import { createAttemptLogger, trackEvent } from "../observe.ts";
import { getPhaseConfig } from "../phase-config.ts";

/** Bump when the deep-time prompt, seed pool, or quality rules change. */
export const PROMPT_VERSION = "v2";

// ── Public types ──

export interface ZoomOutResult {
  data: any | null;  // { onThisDay, currentPrice, echo, deepTime, partial }
  source: "live" | "cache" | "curated" | "empty";
  cacheId: string | null;
  error?: string;
}

export interface GenerateZoomOutParams {
  svcClient: any;
  context?: string;
  language?: string;
  reflectionMessage?: string;
  mood?: string;
  userId?: string;
  recentTitles?: string[];
  zoomOutAngle?: string;
  log: (msg: string, extra?: Record<string, unknown>) => void;
}

// ── Internals: CoinGecko price fetching ──

interface PriceFetchResult {
  onThisDay: { yearsAgo: number; price: number; date: string }[];
  currentPrice: number | null;
  rateLimited: boolean;
  isPartial: boolean;
}

interface PriceCacheRow {
  date: string;
  price: number;
}

/**
 * Read BTC prices from btc_price_cache ONLY.
 *
 * No external API calls — prices are kept fresh by the refresh-btc-prices
 * cron job (every 15 min). This eliminates CoinGecko rate limit issues
 * during user sessions.
 */
async function fetchHistoricalAndCurrentPrices(
  svcClient: any,
  context: string | undefined,
  log: GenerateZoomOutParams["log"],
): Promise<PriceFetchResult> {
  const today = new Date();
  const currentYear = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const day = today.getUTCDate();
  const todayKey = today.toISOString().slice(0, 10);

  // Build date keys for today + 1-4 years ago
  const yearTargets = [1, 2, 3, 4].map(y => {
    const d = new Date(Date.UTC(currentYear - y, month, day));
    return { yearsAgo: y, dateKey: d.toISOString().slice(0, 10) };
  });

  const allDateKeys = [todayKey, ...yearTargets.map(t => t.dateKey)];

  // Single DB query — fetch all needed prices from cache
  const { data: cached } = await svcClient
    .from("btc_price_cache")
    .select("date, price")
    .in("date", allDateKeys);

  const rows = (cached ?? []) as PriceCacheRow[];
  const priceMap = new Map<string, number>(rows.map((r) => [r.date, r.price]));

  // Current price from today's cache entry
  const currentPrice = priceMap.get(todayKey) ?? null;

  // Historical "on this day" prices
  const onThisDay: { yearsAgo: number; price: number; date: string }[] = [];
  for (const target of yearTargets) {
    const price = priceMap.get(target.dateKey);
    if (typeof price === "number") {
      onThisDay.push({ yearsAgo: target.yearsAgo, date: target.dateKey, price: Math.round(price) });
    }
  }

  log(`prices from cache: current=${currentPrice ?? 'none'}, historical=${onThisDay.length}/4`);

  return {
    onThisDay,
    currentPrice: typeof currentPrice === "number" ? Math.round(currentPrice) : null,
    rateLimited: false, // No API calls = no rate limits
    isPartial: onThisDay.length < yearTargets.length,
  };
}

// ── Internals: Echo reflection fetch ──

async function fetchEchoReflection(
  svcClient: any,
  userId: string,
  context: string | undefined,
  log: GenerateZoomOutParams["log"],
): Promise<any | null> {
  try {
    const direction = context?.toLowerCase().includes("is down") ? "down" : context?.toLowerCase().includes("is up") ? "up" : null;
    if (direction) {
      const { data } = await svcClient.from("reflections").select("message, created_at, mood, outcome, context").eq("user_id", userId).not("outcome", "is", null).lt("created_at", new Date(Date.now() - 3 * 86400000).toISOString()).order("created_at", { ascending: false }).limit(50);
      if (data && data.length > 0) {
        const matching = data.filter((r: any) => direction === "down" ? r.context?.toLowerCase().includes("is down") : r.context?.toLowerCase().includes("is up"));
        const pool = matching.length > 0 ? matching : data;
        return pool[Math.floor(Math.random() * Math.min(pool.length, 10))];
      }
    } else {
      const { data } = await svcClient.from("reflections").select("message, created_at, mood, outcome").eq("user_id", userId).not("outcome", "is", null).lt("created_at", new Date(Date.now() - 3 * 86400000).toISOString()).order("created_at", { ascending: false }).limit(10);
      if (data && data.length > 0) return data[0];
    }
  } catch (e) { log(`echo fetch failed: ${e}`); }
  return null;
}

// ── Internals: AI deep-time generation ──

interface DeepTimeResult {
  deepTime: { title: string; body: string } | null;
  source: "live" | "cache" | "curated" | "empty";
  error?: string;
}

async function generateDeepTime(
  svcClient: any,
  params: {
    context?: string;
    mood?: string;
    recentTitles?: string[];
    zoomOutAngle?: string;
    currentPrice: number | null;
    onThisDay: { yearsAgo: number; price: number; date: string }[];
    userId?: string;
    log: GenerateZoomOutParams["log"];
  },
): Promise<DeepTimeResult> {
  const { context, mood, recentTitles, zoomOutAngle, currentPrice, onThisDay, userId, log } = params;
  const logAttempt = createAttemptLogger(svcClient, { userId });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    if (companionFallbacksDisabled()) {
      return { deepTime: null, source: "empty", error: COMPANION_FALLBACKS_DISABLED_MESSAGE };
    }
    const pool = await loadFallbackPool<{ title: string; body: string }>(svcClient, "zoom_out");
    return { deepTime: pickRandom(pool), source: "curated" };
  }

  const priceContext = currentPrice ? `Current BTC price: $${currentPrice.toLocaleString()}.` : "";
  const historyContext = onThisDay.length > 0
    ? `BTC prices on this day: ${onThisDay.map(e => `${e.yearsAgo}y ago: $${e.price.toLocaleString()}`).join(", ")}.`
    : "";

  const titleExclusion = (recentTitles && Array.isArray(recentTitles) && recentTitles.length > 0)
    ? `\nDo NOT reuse these titles or topics (already shown): ${recentTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT perspective.`
    : "";

  // Pick a random thematic seed to force diversity in generated content
  const DEEP_TIME_SEEDS = [
    "Compare Bitcoin's age to the history of money (shells, salt, gold, paper, digital)",
    "Frame today's volatility against geological timescales (Grand Canyon, tectonic plates, ice ages)",
    "Technology adoption speed: printing press (50y), electricity (40y), internet (30y), Bitcoin (15y)",
    "The patience of cathedral builders — Notre-Dame took 182 years, Sagrada Familia still ongoing",
    "Light from distant stars: what we see in the sky happened thousands of years ago",
    "The Long Now Foundation's 10,000-year clock and what it means to think in deep time",
    "DNA has stored information for 3.5 billion years — the original proof of work",
    "Human memory vs geological memory: we remember decades, rocks remember eons",
    "The oldest living organism (Pando aspen grove, ~80,000 years) and what persistence means",
    "Voyager 1 has traveled for 47 years and is barely outside our solar system",
    "The Svalbard seed vault: humanity's 1,000-year bet on the future",
    "Stonehenge was built over 1,500 years — longer than the entire history of banking",
    "The cosmic calendar: if the universe's age is one year, humans appear at 11:59 PM on Dec 31",
    "Ancient Sumerian clay tablets recorded debts 5,000 years ago — the first ledgers",
    "The sun has enough fuel for another 5 billion years — perspective on 'long-term'",
    "Continental drift moves plates 2.5cm/year — in Bitcoin's lifetime, they've moved ~40cm",
    "The Library of Alexandria held all human knowledge; Bitcoin holds all human trust",
    "Bristlecone pines in California are 5,000 years old — they were saplings when money was invented",
  ];
  const trimmedAngle = zoomOutAngle?.trim();
  const seed = trimmedAngle
    ? trimmedAngle
    : DEEP_TIME_SEEDS[Math.floor(Math.random() * DEEP_TIME_SEEDS.length)];

  const systemPrompt = `You generate ONE deep-time perspective for a Bitcoin mindfulness app. Zoom WAY out — beyond markets, beyond decades — into civilizational, planetary, or epochal timescales.

Think like the Long Now Foundation. Think in centuries and millennia.

THEMATIC SEED FOR THIS SESSION (use this as your starting point, but make it your own):
${seed}

ACCURACY RULES (CRITICAL):
- Every number must be verifiable and widely accepted
- Prefer well-known facts over obscure claims
- Use approximate numbers when unsure ("roughly 300,000 years")

BANNED PHRASES — NEVER use any of these: ${BANNED_PHRASES.join(", ")}

FORMAT: JSON with "title" (3-8 word evocative phrase) and "body" (1-2 poetic but factual sentences).
No trading advice, no price predictions, no exclamation marks.${mood ? `\n\nUSER MOOD: The user is feeling "${mood}". Let this subtly inform which deep-time perspective you choose.` : ""}${titleExclusion}`;

  const aiBody = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${context || "BTC is moving today."} ${priceContext} ${historyContext}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  };

  const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
  const AI_TIMEOUTS = [8000, 6000];
  let deepTime: { title: string; body: string } | null = null;

  for (let idx = 0; idx < models.length; idx++) {
    const model = models[idx];
    const aiController = new AbortController();
    const aiTimeout = setTimeout(() => aiController.abort(), AI_TIMEOUTS[idx]);
    const attemptT0 = Date.now();
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...aiBody, model }),
        signal: aiController.signal,
      });
      clearTimeout(aiTimeout);
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const usage = aiData.usage;
        const raw = aiData.choices?.[0]?.message?.content;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const qg = qualityGate("zoom_out_deep_time", parsed);
            if (parsed.title && parsed.body && qg.pass) {
              deepTime = { title: parsed.title, body: parsed.body };
              logAttempt({ companion_type: "zoom_out", provider: "lovable", model, status: "success", latency_ms: Date.now() - attemptT0, input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
              // Cache with rich metadata and title-based dedup
              try {
                const { data: existing } = await svcClient.from("companion_cache").select("content").eq("companion_type", COMPANION_ZOOM_OUT_DEEP_TIME).eq("language", "en").limit(30);
                const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
                const newNorm = norm(parsed.title);
                const isDup = existing?.some((e: any) => { const t = norm(e.content?.title || ""); return t === newNorm || t.includes(newNorm) || newNorm.includes(t); });
                if (!isDup) {
                  const fingerprint = await contentFingerprint(newNorm);
                  const { error: cacheErr } = await svcClient.from("companion_cache").insert({
                    companion_type: COMPANION_ZOOM_OUT_DEEP_TIME,
                    language: "en",
                    content: deepTime,
                    quality_score: 2,
                    title: parsed.title,
                    title_norm: newNorm,
                    fingerprint,
                    source_kind: "deep_time",
                    market_regime: parseMarketDirection(context),
                    expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
                    automated_score: 2,
                  });
                  if (cacheErr) log(`cache insert error: ${cacheErr.message}`);
                }
              } catch (e) { log(`cache write failed: ${e}`); }
              break;
            } else if (parsed.title && parsed.body) {
              const qgReason = qg.reason ?? "deep_time_quality";
              log(`deepTime quality gate failed: ${qgReason} body=${(parsed.body || "").length}chars`);
              logQualityGateStructuredReject("zoom_out_deep_time", qgReason);
              logAttempt({
                companion_type: "zoom_out",
                provider: "lovable",
                model,
                status: "quality_gate_failed",
                latency_ms: Date.now() - attemptT0,
                quality_gate_reason: qgReason,
                input_tokens: usage?.prompt_tokens,
                output_tokens: usage?.completion_tokens,
              });
              if (model !== models[models.length - 1]) continue;
            }
          } catch {
            logAttempt({ companion_type: "zoom_out", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: "json_parse_failed" });
            if (model !== models[models.length - 1]) continue;
          }
        } else {
          logAttempt({ companion_type: "zoom_out", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: "empty content" });
          if (model !== models[models.length - 1]) continue;
        }
      } else {
        await aiRes.text();
        logAttempt({ companion_type: "zoom_out", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: `HTTP ${aiRes.status}` });
        if (model !== models[models.length - 1]) continue;
      }
    } catch (e) {
      clearTimeout(aiTimeout);
      logAttempt({ companion_type: "zoom_out", provider: "lovable", model, status: e instanceof DOMException && e.name === "AbortError" ? "timeout" : "error", latency_ms: Date.now() - attemptT0, error_message: String(e) });
      if (model !== models[models.length - 1]) continue;
    }
  }

  // Fallback chain: cache (per-user + market-aware) → curated
  if (!deepTime) {
    if (companionFallbacksDisabled()) {
      return { deepTime: null, source: "empty", error: COMPANION_FALLBACKS_DISABLED_MESSAGE };
    }
    const marketDirection = parseMarketDirection(context);
    const cached = await serveFromCache(svcClient, COMPANION_ZOOM_OUT_DEEP_TIME, "en", { userId, marketDirection });
    if (cached) {
      return { deepTime: cached.data as { title: string; body: string }, source: "cache" };
    }

    const zpool = await loadFallbackPool<{ title: string; body: string }>(svcClient, "zoom_out");
    return { deepTime: pickRandom(zpool), source: "curated" };
  }

  return { deepTime, source: "live" };
}

// ── Public entry point ──

export async function generateZoomOut(params: GenerateZoomOutParams): Promise<ZoomOutResult> {
  const { svcClient, context, mood, recentTitles, userId, zoomOutAngle, log } = params;
  const phases = getPhaseConfig();

  // ── Phase 2: Cache (no library type for zoom-out) ──
  if (phases.cache) {
    const marketDirection = parseMarketDirection(context);
    const cached = await serveFromCache(svcClient, COMPANION_ZOOM_OUT_DEEP_TIME, "en", { userId, marketDirection });
    if (cached) {
      log("zoomOut resolved from cache (phase 2)");
      const prices = await fetchHistoricalAndCurrentPrices(svcClient, context, log);
      let echoReflection: any = null;
      if (userId) echoReflection = await fetchEchoReflection(svcClient, userId, context, log);
      return {
        data: {
          onThisDay: prices.onThisDay,
          currentPrice: prices.currentPrice,
          echo: echoReflection ? { message: echoReflection.message, created_at: echoReflection.created_at, mood: echoReflection.mood, outcome: echoReflection.outcome } : null,
          deepTime: cached.data as { title: string; body: string },
          partial: prices.isPartial,
        },
        source: "cache",
        cacheId: cached.cacheId,
      };
    }
  }

  // ── Phase 3: Live generation ──
  if (!phases.live) {
    log("live phase disabled, serving curated");
    if (companionFallbacksDisabled()) {
      return { data: null, source: "empty", cacheId: null, error: COMPANION_FALLBACKS_DISABLED_MESSAGE };
    }
    const pool = await loadFallbackPool<{ title: string; body: string }>(svcClient, "zoom_out");
    const prices = await fetchHistoricalAndCurrentPrices(svcClient, context, log);
    return {
      data: {
        onThisDay: prices.onThisDay,
        currentPrice: prices.currentPrice,
        echo: null,
        deepTime: pickRandom(pool),
        partial: prices.isPartial,
      },
      source: "curated",
      cacheId: null,
    };
  }

  // ── 1. Fetch historical BTC prices with DB caching ──
  const prices = await fetchHistoricalAndCurrentPrices(svcClient, context, log);

  // CoinGecko is no longer called during sessions — prices come from
  // the refresh-btc-prices cron job via btc_price_cache.

  // ── 2. Fetch past echo reflection ──
  let echoReflection: any = null;
  if (userId) {
    echoReflection = await fetchEchoReflection(svcClient, userId, context, log);
  }

  // ── 3. Generate deep-time perspective via AI ──
  const deepTimeResult = await generateDeepTime(svcClient, {
    context,
    mood,
    recentTitles,
    zoomOutAngle,
    currentPrice: prices.currentPrice,
    onThisDay: prices.onThisDay,
    userId,
    log,
  });

  // ── 4. Build response ──
  const result = {
    onThisDay: prices.onThisDay,
    currentPrice: prices.currentPrice,
    echo: echoReflection ? { message: echoReflection.message, created_at: echoReflection.created_at, mood: echoReflection.mood, outcome: echoReflection.outcome } : null,
    deepTime: deepTimeResult.deepTime,
    partial: prices.isPartial,
  };

  if (userId && deepTimeResult.source === "live") {
    trackEvent(svcClient, userId, "zoom_out_ai_call");
  }

  return {
    data: result,
    source: deepTimeResult.source,
    cacheId: null,
    error: deepTimeResult.error,
  };
}
