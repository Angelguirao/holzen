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

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
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
import {
  type CacheServeRelaxation,
  COMPANION_ZOOM_OUT_DEEP_TIME,
  parseMarketDirection,
  serveFromCache,
} from "../cache.ts";
import { createAttemptLogger, trackEvent } from "../observe.ts";
import { getPhaseConfig } from "../phase-config.ts";
import { BTC_ON_THIS_DAY_YEARS_BACK, btcOnThisDayYearOffsets } from "../btc-on-this-day-config.ts";
import { warmMissingBtcPrices } from "../btc-price-warm.ts";
import { fetchPastReflectionWithWords, type PastReflectionWithWords } from "../past-reflections.ts";
import { type CompanionCacheTitleRow } from "../companion-cache-dedup.ts";
import { errorMessageFromUnknown, getEdgeRuntime } from "../edge-runtime.ts";
import { normalizeTrackedAssetId } from "../tracked-assets.ts";

/** Bump when the deep-time prompt, seed pool, or quality rules change. */
export const PROMPT_VERSION = "v4";

// ── Public types ──

/** Composite zoom-out payload returned to orchestrate / clients. */
export interface ZoomOutCompositeData {
  onThisDay: { yearsAgo: number; price: number; date: string }[];
  currentPrice: number | null;
  echo: Record<string, unknown> | null;
  deepTime: { title: string; body: string } | null;
  partial: boolean;
}

export interface ZoomOutResult {
  data: ZoomOutCompositeData | null;
  source: "live" | "cache" | "curated" | "empty";
  cacheId: string | null;
  /** Set when deep-time text came from `serveFromCache`. */
  cacheRelaxation?: CacheServeRelaxation;
  error?: string;
}

export interface GenerateZoomOutParams {
  svcClient: SupabaseClient;
  context?: string;
  language?: string;
  reflectionMessage?: string;
  mood?: string;
  userId?: string;
  recentTitles?: string[];
  zoomOutAngle?: string;
  /** Skip cache phase and go straight to live (used by regenerate). */
  forceLive?: boolean;
  /** Skip the live phase only — cache still serves. Used by circuit breaker. */
  skipLive?: boolean;
  /** When not bitcoin, skip BTC anniversary cache pipeline and serve curated deep-time only. */
  trackedAssetId?: string | null;
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
  svcClient: SupabaseClient,
  context: string | undefined,
  log: GenerateZoomOutParams["log"],
): Promise<PriceFetchResult> {
  const today = new Date();
  const currentYear = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const day = today.getUTCDate();
  const todayKey = today.toISOString().slice(0, 10);

  // Build date keys for today + 1..N calendar years ago (see btc-on-this-day-config)
  const yearTargets = btcOnThisDayYearOffsets().map((y) => {
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

  log(`prices from cache: current=${currentPrice ?? 'none'}, historical=${onThisDay.length}/${BTC_ON_THIS_DAY_YEARS_BACK}`);

  // Background warm-on-read: if any anniversary dates were missing from the
  // cache, kick off a non-blocking fill via `EdgeRuntime.waitUntil` so the next
  // session has a full timeline. Current session still returns with whatever it
  // has now — this costs the user nothing. The helper dedupes via a 15-min
  // freshness check, so concurrent sessions with the same gap won't hammer
  // CoinGecko. Only runs when the Supabase edge runtime exposes `waitUntil`.
  const missingDateKeys = yearTargets
    .filter((t) => !priceMap.has(t.dateKey))
    .map((t) => t.dateKey);
  const rt = getEdgeRuntime();
  if (missingDateKeys.length > 0 && rt) {
    try {
      rt.waitUntil(
        warmMissingBtcPrices(svcClient, missingDateKeys)
          .then((warm) => {
            log(
              `btc warm-on-read: attempted=${warm.attempted} upserted=${warm.upserted} ` +
                `rate_limited=${warm.rateLimited} other=${warm.other} skipped_recent=${warm.skippedRecent}`,
            );
          })
          .catch((e) => {
            log(`btc warm-on-read failed: ${errorMessageFromUnknown(e)}`);
          }),
      );
    } catch (e) {
      log(`btc warm-on-read scheduling failed: ${errorMessageFromUnknown(e)}`);
    }
  }

  return {
    onThisDay,
    currentPrice: typeof currentPrice === "number" ? Math.round(currentPrice) : null,
    rateLimited: false, // No API calls on the blocking path = no rate limits
    isPartial: onThisDay.length < yearTargets.length,
  };
}

// ── Internals: Echo (past pause user words) fetch — strict user-words-only ──

/**
 * Build the `echo` slot for the zoom-out composite payload.
 *
 * Strict policy (2026-04-18): Echo surfaces ONLY user-authored text from the
 * Pause V2 read model — notes / replays via `pause_step_events` and
 * `practice_entries` (`_shared/past-reflections.ts`). It NEVER surfaces
 * `v_pause_full.reflection_text` (the AI-generated reflect-step prompt), which was the
 * previous behaviour behind the misleading "your own words from another day"
 * UI label. If the user has never left a note or replay on a past pause,
 * `echo` is `null` and the card renders a truthful empty state.
 */
function echoPayloadFromPast(p: PastReflectionWithWords | null): Record<string, unknown> | null {
  if (!p) return null;
  return {
    id: p.id,
    created_at: p.created_at,
    mood: p.mood,
    outcome: p.outcome,
    context: p.context,
    aiPrompt: p.aiPrompt,
    userWords: p.userWords,
  };
}

async function fetchEchoReflection(
  svcClient: SupabaseClient,
  userId: string,
  context: string | undefined,
  log: GenerateZoomOutParams["log"],
): Promise<PastReflectionWithWords | null> {
  return fetchPastReflectionWithWords(
    svcClient,
    userId,
    { sessionContext: context },
    (msg, extra) => log(msg, extra),
  );
}

// ── Internals: AI deep-time generation ──

interface DeepTimeResult {
  deepTime: { title: string; body: string } | null;
  source: "live" | "cache" | "curated" | "empty";
  error?: string;
  cacheId?: string | null;
  cacheRelaxation?: CacheServeRelaxation;
}

async function generateDeepTime(
  svcClient: SupabaseClient,
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

  // Previously we passed `Current BTC price` and "on this day" dollar amounts
  // into the user message. The `zoom_out_deep_time` quality gate has
  // `noMarketData: true` which rejects any body containing `$<digit>` or
  // `<digits>%` — and Gemini reliably echoed those numbers back, causing
  // `body_contains_market_data` rejects. Dropping the price scaffold entirely
  // is the right fix: deep-time narration should be ORTHOGONAL to price (that's
  // the whole point of zooming out) — the prices are already shown by the
  // "On this day" panel in the UI composite. Keep `context` for mood framing
  // but let the prompt handle the "don't mention prices" rule.
  // Unused for now; kept here so git blame shows the removed injection path.
  void currentPrice;
  void onThisDay;

  const titleExclusion = (recentTitles && Array.isArray(recentTitles) && recentTitles.length > 0)
    ? `\nDo NOT reuse these titles or topics (already shown): ${recentTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT perspective.`
    : "";

  // Pick a random thematic seed to force diversity in generated content.
  // Grouped loosely by category; expanded 2026-04-18 from 18 -> 33 to reduce
  // "same card over and over" after the cache-version invalidation bump.
  const DEEP_TIME_SEEDS = [
    // Money & ledgers
    "Compare Bitcoin's age to the history of money (shells, salt, gold, paper, digital)",
    "Ancient Sumerian clay tablets recorded debts 5,000 years ago — the first ledgers",
    "The Rai stones of Yap: immutable public ledger, no movement required, 1,500+ years old",
    "Gold has served as money for ~5,000 years — fiat currencies average 27 years before collapse",
    "Medieval tally sticks: England's government money for 700 years, burned in 1834",
    // Geological / planetary
    "Frame today's volatility against geological timescales (Grand Canyon, tectonic plates, ice ages)",
    "Continental drift moves plates 2.5cm/year — in Bitcoin's lifetime, they've moved ~40cm",
    "The Pacific Ocean is widening by ~7cm/year; the Atlantic by ~2.5cm — planetary patience",
    "Antarctic ice cores hold an 800,000-year climate record, one year per centimeter",
    // Biological
    "DNA has stored information for 3.5 billion years — the original proof of work",
    "The oldest living organism (Pando aspen grove, ~80,000 years) and what persistence means",
    "Bristlecone pines in California are 5,000 years old — they were saplings when money was invented",
    "Coral reefs grow 1–3cm per year; the Great Barrier Reef has been building for 500,000 years",
    "Sequoias live 3,000+ years by growing slowly and surviving fire — the case for patience",
    // Technology adoption
    "Technology adoption speed: printing press (50y), electricity (40y), internet (30y), Bitcoin (15y)",
    "The telegraph compressed news from weeks to minutes — networks don't unwind once woven",
    "The internet's TCP/IP protocol is 50 years old and still runs on the same core rules",
    // Civilizational / monumental
    "The patience of cathedral builders — Notre-Dame took 182 years, Sagrada Familia still ongoing",
    "Stonehenge was built over 1,500 years — longer than the entire history of banking",
    "The Library of Alexandria held all human knowledge; Bitcoin holds all human trust",
    "The Great Wall of China was built across seven dynasties spanning 2,000 years",
    "The Pyramids of Giza have stood for ~4,500 years — longer than most civilizations exist",
    // Long-horizon thinking
    "The Long Now Foundation's 10,000-year clock and what it means to think in deep time",
    "The Svalbard seed vault: humanity's 1,000-year bet on the future",
    "The cosmic calendar: if the universe's age is one year, humans appear at 11:59 PM on Dec 31",
    "Human memory vs geological memory: we remember decades, rocks remember eons",
    // Cosmic
    "Light from distant stars: what we see in the sky happened thousands of years ago",
    "Voyager 1 has traveled for 47 years and is barely outside our solar system",
    "The sun has enough fuel for another 5 billion years — perspective on 'long-term'",
    "The Andromeda galaxy is approaching ours at 110km/s — collision in 4.5 billion years",
    "Proxima Centauri, our nearest star, is 4.2 light-years away — 40 trillion km",
    // Bitcoin as protocol
    "Bitcoin as TCP/IP — a protocol that survives by being boring, not by being fast",
    "The Lindy effect: the longer something persists, the longer it's expected to persist",
    "Every halving cycle is roughly one human generation apart, not one trading year",
  ];
  const trimmedAngle = zoomOutAngle?.trim();
  const seed = trimmedAngle
    ? trimmedAngle
    : DEEP_TIME_SEEDS[Math.floor(Math.random() * DEEP_TIME_SEEDS.length)];

  const systemPrompt = `You generate ONE deep-time perspective for a Bitcoin mindfulness app. Zoom WAY out — beyond markets, beyond decades — into civilizational, planetary, or epochal timescales.

Think like the Long Now Foundation. Think in centuries and millennia.

THEMATIC SEED FOR THIS SESSION (use this as your starting point, but make it your own):
${seed}

TIMESCALE REQUIREMENT (CRITICAL):
- Anchor the narrative in a concrete span of at least 100 years, ideally 1,000+
- Name the specific timescale explicitly (e.g. "5,000 years", "3.5 billion years", "since the 12th century")
- If the seed suggests multiple scales, pick the longest one that still feels human

ACCURACY RULES (CRITICAL):
- Every number must be verifiable and widely accepted
- Prefer well-known facts over obscure claims
- Use approximate numbers when unsure ("roughly 300,000 years")

NEVER MENTION:
- BTC prices, dollar amounts, percentages, market moves
- Price predictions or trading advice
- Exclamation marks

BANNED PHRASES — NEVER use any of these: ${BANNED_PHRASES.join(", ")}

LENGTH: body MUST be ≤480 characters total (hard ceiling 500). Prefer 2 tight poetic sentences over a long one.

FORMAT: JSON with "title" (3-8 word evocative phrase) and "body" (1-2 poetic but factual sentences, ≤480 chars).${mood ? `\n\nUSER MOOD: The user is feeling "${mood}". Let this subtly inform which deep-time perspective you choose.` : ""}${titleExclusion}`;

  const aiBody = {
    messages: [
      { role: "system", content: systemPrompt },
      // Context is intentionally minimal — no price scaffolding. The "zoom out"
      // from today's move comes from the seed and the timescale requirement,
      // not from echoing a dollar figure (which the quality gate rejects).
      { role: "user", content: context?.trim() ? context.trim() : "Generate one deep-time perspective." },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  };

  const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
  // Bumped 2026-04-18 from [8000, 6000]. Gemini Flash structuring occasionally
  // overran the old budgets for zoom-out (which has a denser system prompt and
  // temperature 0.7); timeouts caused us to fall through to the lite model or
  // curated fallback unnecessarily. 10s/8s keeps the user-perceived latency
  // well under the reflect-step patience budget while giving the model enough
  // headroom to finish.
  const AI_TIMEOUTS = [10000, 8000];
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
                const isDup = existing?.some((e: CompanionCacheTitleRow) => {
                  const t = norm(e.content?.title || "");
                  return t === newNorm || t.includes(newNorm) || newNorm.includes(t);
                });
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
                    prompt_version: PROMPT_VERSION,
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
    const cached = await serveFromCache(svcClient, COMPANION_ZOOM_OUT_DEEP_TIME, "en", {
      userId,
      marketDirection,
      promptVersion: PROMPT_VERSION,
      structuredLog: log,
    });
    if (cached) {
      return {
        deepTime: cached.data as { title: string; body: string },
        source: "cache",
        cacheId: cached.cacheId,
        cacheRelaxation: cached.relaxation,
      };
    }

    const zpool = await loadFallbackPool<{ title: string; body: string }>(svcClient, "zoom_out");
    return { deepTime: pickRandom(zpool), source: "curated" };
  }

  return { deepTime, source: "live" };
}

// ── Public entry point ──

export async function generateZoomOut(params: GenerateZoomOutParams): Promise<ZoomOutResult> {
  const { svcClient, context, mood, recentTitles, userId, zoomOutAngle, forceLive, skipLive, log } = params;
  const tracked = normalizeTrackedAssetId(params.trackedAssetId);
  if (tracked !== "bitcoin") {
    log(`zoomOut: tracked asset ${tracked} — BTC anniversary pipeline skipped`);
    if (companionFallbacksDisabled()) {
      return { data: null, source: "empty", cacheId: null, error: COMPANION_FALLBACKS_DISABLED_MESSAGE };
    }
    const pool = await loadFallbackPool<{ title: string; body: string }>(svcClient, "zoom_out");
    let echoPast: PastReflectionWithWords | null = null;
    if (userId) echoPast = await fetchEchoReflection(svcClient, userId, context, log);
    return {
      data: {
        onThisDay: [],
        currentPrice: null,
        echo: echoPayloadFromPast(echoPast),
        deepTime: pickRandom(pool),
        partial: true,
      },
      source: "curated",
      cacheId: null,
    };
  }

  const phases = getPhaseConfig();
  const liveEnabled = phases.live && !skipLive;

  // ── Phase 2: Cache (no library type for zoom-out; strict — fall through to live if no fresh row) ──
  if (phases.cache && !forceLive) {
    const marketDirection = parseMarketDirection(context);
    const cached = await serveFromCache(svcClient, COMPANION_ZOOM_OUT_DEEP_TIME, "en", {
      userId,
      marketDirection,
      strict: true,
      promptVersion: PROMPT_VERSION,
      structuredLog: log,
    });
    if (cached) {
      log("zoomOut resolved from cache (phase 2)");
      const prices = await fetchHistoricalAndCurrentPrices(svcClient, context, log);
      let echoPast: PastReflectionWithWords | null = null;
      if (userId) echoPast = await fetchEchoReflection(svcClient, userId, context, log);
      return {
        data: {
          onThisDay: prices.onThisDay,
          currentPrice: prices.currentPrice,
          echo: echoPayloadFromPast(echoPast),
          deepTime: cached.data as { title: string; body: string },
          partial: prices.isPartial,
        },
        source: "cache",
        cacheId: cached.cacheId,
        cacheRelaxation: cached.relaxation,
      };
    }
  }

  // ── Phase 3: Live generation ──
  if (!liveEnabled && !forceLive) {
    log(skipLive ? "zoomOut: live phase skipped (breaker), serving curated" : "live phase disabled, serving curated");
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
  if (skipLive && forceLive) {
    log("zoomOut: breaker tripped and forceLive requested — returning blocked");
    return { data: null, source: "empty", cacheId: null, error: "circuit_breaker" };
  }

  // ── 1. Fetch historical BTC prices with DB caching ──
  const prices = await fetchHistoricalAndCurrentPrices(svcClient, context, log);

  // CoinGecko is no longer called during sessions — prices come from
  // the refresh-btc-prices cron job via btc_price_cache.

  // ── 2. Fetch past echo reflection (strict user-words-only — never AI text) ──
  let echoPast: PastReflectionWithWords | null = null;
  if (userId) {
    echoPast = await fetchEchoReflection(svcClient, userId, context, log);
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
    echo: echoPayloadFromPast(echoPast),
    deepTime: deepTimeResult.deepTime,
    partial: prices.isPartial,
  };

  if (userId && deepTimeResult.source === "live") {
    trackEvent(svcClient, userId, "zoom_out_ai_call");
  }

  return {
    data: result,
    source: deepTimeResult.source,
    cacheId: deepTimeResult.cacheId ?? null,
    cacheRelaxation: deepTimeResult.cacheRelaxation,
    error: deepTimeResult.error,
  };
}
