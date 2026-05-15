/**
 * Reusable grounding-nudge generation pipeline.
 *
 * Owns: Perplexity academic search → AI structuring → quality gate → URL post-processing
 *       → cache write → background URL validation → fallback chain.
 *
 * Does NOT own: HTTP handling, auth, CORS, analytics event tracking.
 * API keys are read from Deno.env directly (same as the original function).
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  qualityGate,
  containsSlop,
  isUrlReachable,
  contentFingerprint,
  logQualityGateStructuredReject,
} from "../quality.ts";
import {
  companionFallbacksDisabled,
  COMPANION_FALLBACKS_DISABLED_MESSAGE,
  loadFallbackPool,
  pickRandom,
} from "../fallbacks.ts";
import { type CacheServeRelaxation, parseMarketDirection, serveFromCache } from "../cache.ts";
import { createAttemptLogger, trackEvent } from "../observe.ts";
import { enqueueCatalogSourceSuggestion } from "../source-suggestions.ts";
import { callPerplexityChat, mergePerplexityUsage } from "../perplexity-client.ts";
import { searchLibrary, paperToGrounding, recordLibraryServe } from "../content-library.ts";
import { getPhaseConfig } from "../phase-config.ts";
import { type CompanionCacheTitleRow } from "../companion-cache-dedup.ts";

/** Bump when the search query, structuring prompt, or quality rules change. */
export const PROMPT_VERSION = "v4";

/**
 * Temporarily disable the Phase-1 library lookup for grounding.
 *
 * As of 2026-04-18 `content_library` has no rows of `type: "paper"` and the
 * ingestion pipeline for papers is parked. Every library call would only emit
 * `library_search_rejected reason:"empty"` and add an unnecessary DB round-trip
 * per grounding request. Skipping the phase entirely is faster and keeps the
 * edge logs quieter.
 *
 * Flip this back to `true` when we resume ingesting papers into
 * `content_library` (or replace with a `COMPANION_PHASE_LIBRARY_GROUNDING`
 * env-var toggle if we need runtime control).
 */
const GROUNDING_LIBRARY_ENABLED = false;

// ── Public types ──

export interface GroundingResult {
  data: { title: string; body: string; citation: string; url: string } | null;
  /** `library` = served from `content_library`; `cache` = served from runtime `companion_cache`. */
  source: "live" | "library" | "cache" | "curated" | "empty";
  cacheId: string | null;
  /** Set when `serveFromCache` served this row (not library / curated). */
  cacheRelaxation?: CacheServeRelaxation;
  error?: string;
}

export interface GenerateGroundingParams {
  svcClient: SupabaseClient;
  context?: string;
  language?: string;
  recentTopics?: string[];
  /** User's grounding catalog + custom URLs (parity with `generateSignal` `sources`). */
  sources?: Array<{ name: string; type: string; url?: string }>;
  /** Hostnames or publisher labels to avoid repeating (parity with `recentSignalSources`). */
  recentGroundingSources?: string[];
  /** Past nudge titles to avoid duplicating angles (typically `recentNudgeTopics` from orchestrator). */
  recentGroundingTitles?: string[];
  userId?: string;
  pauseInstanceId?: string | null;
  preferredBias?: string;
  /** Skip library/cache phases and go straight to live (used by regenerate). */
  forceLive?: boolean;
  /** Skip the live phase only — library/cache still serve. Used by circuit breaker. */
  skipLive?: boolean;
  log: (msg: string, extra?: Record<string, unknown>) => void;
  /** Edge `Request` for W3C trace propagation to Perplexity. */
  incomingRequest?: Request;
}

// ── Internals ──

function buildSourceHints(sources?: Array<{ name: string; type: string; url?: string }>) {
  const sourceNames: string[] = [];
  const sourceUrls: string[] = [];
  if (sources && Array.isArray(sources)) {
    for (const s of sources) {
      if (s.name) sourceNames.push(s.name);
      if (s.url && typeof s.url === "string") {
        try {
          const hostname = new URL(s.url.startsWith("http") ? s.url : `https://${s.url}`)
            .hostname.replace(/^www\./, "");
          if (hostname && !sourceUrls.includes(hostname)) sourceUrls.push(hostname);
        } catch { /* skip malformed URLs */ }
      }
    }
  }
  return { sourceNames, sourceUrls };
}

const BIAS_TOPICS: { topic: string; direction: "down" | "up" | "both" }[] = [
  { topic: "loss aversion and panic selling during market drops", direction: "down" },
  { topic: "FOMO and herding behavior during market rallies", direction: "up" },
  { topic: "disposition effect — selling winners too early and holding losers too long", direction: "up" },
  { topic: "anchoring bias and mental accounting in investment decisions", direction: "both" },
  { topic: "emotional regulation and prefrontal cortex function during financial stress", direction: "down" },
  { topic: "endowment effect and status quo bias in portfolio management", direction: "both" },
  { topic: "recency bias and availability heuristic in market predictions", direction: "down" },
  { topic: "overconfidence bias and illusion of control in trading decisions", direction: "up" },
  { topic: "regret aversion and its effect on long-term investment holding", direction: "both" },
  { topic: "social proof and information cascading in Bitcoin markets", direction: "down" },
];

function findMatchingBiasTopic(preferredBias: string | undefined): (typeof BIAS_TOPICS)[number] | null {
  const pref = preferredBias?.trim().toLowerCase();
  if (!pref) return null;
  for (const t of BIAS_TOPICS) {
    const tl = t.topic.toLowerCase();
    if (tl.includes(pref) || pref.includes(tl)) return t;
    const words = pref.split(/\s+/).filter((w) => w.length > 4);
    if (words.some((w) => tl.includes(w))) return t;
  }
  return null;
}

/** Try content_library (papers) for grounding. */
async function tryLibrary(
  svcClient: SupabaseClient,
  userId?: string,
): Promise<GroundingResult | null> {
  const libraryRows = await searchLibrary(svcClient, {
    type: "paper",
    companionType: "ground_nudge",
    userId,
    includeStale: false,
  });
  if (libraryRows.length > 0) {
    const pick = libraryRows[Math.floor(Math.random() * Math.min(libraryRows.length, 3))];
    const result = paperToGrounding(pick);
    recordLibraryServe(svcClient, userId, pick.id, "ground_nudge");
    return { data: result, source: "library", cacheId: null };
  }
  return null;
}

/**
 * Try companion_cache for grounding.
 *
 * `strict: true` (used by Phase-2 main flow) skips the pass-3 `repeat_or_lower_quality`
 * relaxation so an empty strict pool falls through to Phase-3 live. `strict: false`
 * (used by `serveFallback` after live failure) keeps pass-3 as a last-resort serve.
 */
async function tryCache(
  svcClient: SupabaseClient,
  userId?: string,
  marketDirection?: "up" | "down" | "neutral",
  excludeIds?: string[],
  strict = false,
  structuredLog?: GenerateGroundingParams["log"],
): Promise<GroundingResult | null> {
  const cached = await serveFromCache(svcClient, "ground_nudge", "en", {
    userId,
    marketDirection,
    excludeIds,
    strict,
    structuredLog,
  });
  if (cached) {
    return {
      data: cached.data as GroundingResult["data"],
      source: "cache",
      cacheId: cached.cacheId,
      cacheRelaxation: cached.relaxation,
    };
  }
  return null;
}

/** Last-resort curated fallback pool. */
async function serveCurated(svcClient: SupabaseClient): Promise<GroundingResult> {
  const pool = await loadFallbackPool<{ title: string; body: string; citation: string; url: string }>(svcClient, "grounding");
  return { data: pickRandom(pool), source: "curated", cacheId: null };
}

/** Resolve from non-live phases in order (library → cache → curated). */
async function serveFallback(
  svcClient: SupabaseClient,
  userId?: string,
  marketDirection?: "up" | "down" | "neutral",
  excludeIds?: string[],
  structuredLog?: GenerateGroundingParams["log"],
): Promise<GroundingResult> {
  if (companionFallbacksDisabled()) {
    return { data: null, source: "empty", cacheId: null, error: COMPANION_FALLBACKS_DISABLED_MESSAGE };
  }
  const phases = getPhaseConfig();
  if (phases.library && GROUNDING_LIBRARY_ENABLED) {
    const lib = await tryLibrary(svcClient, userId);
    if (lib) return lib;
  }
  if (phases.cache) {
    const cached = await tryCache(svcClient, userId, marketDirection, excludeIds, false, structuredLog);
    if (cached) return cached;
  }
  return serveCurated(svcClient);
}

// ── Public entry point ──

export async function generateGrounding(params: GenerateGroundingParams): Promise<GroundingResult> {
  const {
    svcClient,
    context,
    recentTopics,
    sources,
    recentGroundingSources,
    recentGroundingTitles,
    userId,
    pauseInstanceId,
    preferredBias,
    forceLive,
    skipLive,
    log,
    incomingRequest,
  } = params;
  const marketDirectionForCache = parseMarketDirection(context);
  const phases = getPhaseConfig();
  const liveEnabled = phases.live && !skipLive;

  if (!forceLive) {
  // ── Phase 1: Library (disabled for grounding — see GROUNDING_LIBRARY_ENABLED) ──
  if (phases.library && GROUNDING_LIBRARY_ENABLED) {
    const lib = await tryLibrary(svcClient, userId);
    if (lib) {
      log("grounding resolved from library (phase 1)");
      return lib;
    }
  }

  // ── Phase 2: Cache (strict — no pass-3 repeats; fall through to live if strict pool empty) ──
  if (phases.cache) {
    const cached = await tryCache(svcClient, userId, marketDirectionForCache, undefined, true, log);
    if (cached) {
      log("grounding resolved from cache (phase 2)");
      return cached;
    }
  }
  } // end !forceLive

  // ── Phase 3: Live generation ──
  if (!liveEnabled && !forceLive) {
    log(skipLive ? "grounding: live phase skipped (breaker), serving curated" : "live phase disabled, serving curated");
    if (companionFallbacksDisabled()) {
      return { data: null, source: "empty", cacheId: null, error: COMPANION_FALLBACKS_DISABLED_MESSAGE };
    }
    return serveCurated(svcClient);
  }
  if (skipLive && forceLive) {
    log("grounding: breaker tripped and forceLive requested — returning blocked");
    return { data: null, source: "empty", cacheId: null, error: "circuit_breaker" };
  }

  const logAttempt = createAttemptLogger(svcClient, { userId });

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
    log("missing API keys, serving fallback");
    return serveFallback(svcClient, userId, marketDirectionForCache, undefined, log);
  }

  // ── Bias topic selection, matching market direction and avoiding recently used ones ──
  const recentSet = new Set((recentTopics || []).map((t: string) => t.toLowerCase()));
  const contextLower = (context || "").toLowerCase();
  const marketDirection: "down" | "up" | null =
    contextLower.includes("is down") || contextLower.includes("dropped") || contextLower.includes("fell")
      ? "down"
      : contextLower.includes("is up") || contextLower.includes("rallied") || contextLower.includes("surged")
        ? "up"
        : null;

  const directionFiltered = marketDirection
    ? BIAS_TOPICS.filter(t => t.direction === marketDirection || t.direction === "both")
    : BIAS_TOPICS;
  const available = directionFiltered.filter(t => !recentSet.has(t.topic.toLowerCase()));
  const pool = available.length > 0 ? available : directionFiltered.length > 0 ? directionFiltered : BIAS_TOPICS;
  const preferredEntry = findMatchingBiasTopic(preferredBias);
  const preferredUsable = preferredEntry && !recentSet.has(preferredEntry.topic.toLowerCase());
  const randomBias = preferredUsable
    ? preferredEntry.topic
    : pool[Math.floor(Math.random() * pool.length)].topic;

  const marketContext = context || "Bitcoin market volatility";

  const { sourceNames, sourceUrls } = buildSourceHints(sources);
  const recentSourceExcl = (recentGroundingSources && recentGroundingSources.length > 0)
    ? ` Do NOT center the answer on these journals/sites (already surfaced recently): ${recentGroundingSources.slice(0, 5).join(", ")}. Prefer a different venue or research line.`
    : "";
  const topicExcl = (recentGroundingTitles && recentGroundingTitles.length > 0)
    ? `\nDo NOT repeat these recent nudge titles or angles (find a fresh framing): ${recentGroundingTitles.slice(0, 5).join("; ")}.`
    : "";
  const sourceHint = sourceNames.length > 0
    ? ` When possible, surface research that could plausibly appear in or relate to: ${sourceNames.sort(() => Math.random() - 0.5).slice(0, 5).join(", ")}. Still require real peer-reviewed or working-paper quality.`
    : "";

  const searchQuery =
    `Find a specific academic study or research paper about ${randomBias}. The research should be relevant to: ${marketContext}. Include the researcher names, university, year of publication, sample size or key methodology detail, and the main finding. Prefer peer-reviewed journals.${sourceHint}${recentSourceExcl}`;

  // ── Step 1: Perplexity academic search ──
  log("calling perplexity");
  let searchContent = "";
  let citations: string[] = [];

  const perplexityBody: Record<string, unknown> = {
    model: "sonar-pro",
    messages: [
      {
        role: "system",
        content:
          `You are a behavioral finance research assistant. Search for real, specific academic research papers. Return ONE specific study with exact researcher names, publication year, journal name, and quantitative findings. Prefer lesser-known but fascinating studies over the most commonly cited ones.

DIVERSITY: Use a different journal/venue angle when possible. Do not recycle the same famous paper every time.${topicExcl}`,
      },
      { role: "user", content: searchQuery },
    ],
    search_mode: "academic",
    ...(sourceUrls.length > 0 ? { search_domain_filter: sourceUrls.slice(0, 5) } : {}),
  };

  let perplexityApiCalls = 0;
  let perplexityMerged = undefined as ReturnType<typeof mergePerplexityUsage>;

  const perplexityT0 = Date.now();
  try {
    let apiCalls = 0;
    let mergedUsage = undefined as ReturnType<typeof mergePerplexityUsage>;

    const result = await callPerplexityChat(perplexityBody, PERPLEXITY_API_KEY, (m) => log(m), 10_000, incomingRequest);
    apiCalls++;
    mergedUsage = result.usage;
    searchContent = result.content;
    citations = result.citations;
    log(`content length: ${searchContent.length}, citations: ${citations.length}`);

    if (citations.length === 0 && sourceUrls.length > 0 && searchContent.length > 0) {
      log("0 citations with domain filter — retrying without filter");
      const retryBody = { ...perplexityBody };
      delete retryBody.search_domain_filter;
      try {
        const retry = await callPerplexityChat(retryBody, PERPLEXITY_API_KEY, (m) => log(m), 10_000, incomingRequest);
        apiCalls++;
        mergedUsage = mergePerplexityUsage(mergedUsage, retry.usage);
        if (retry.citations.length > 0) {
          searchContent = retry.content;
          citations = retry.citations;
          log(`retry got ${citations.length} citations`);
        }
      } catch { log("retry failed, using original content"); }
    }

    perplexityApiCalls = apiCalls;
    perplexityMerged = mergedUsage;
  } catch (e) {
    log(`perplexity failed: ${e}`);
    logAttempt({
      companion_type: "ground_nudge",
      provider: "perplexity",
      model: "sonar-pro",
      status: String(e).includes("RATE_LIMITED") ? "rate_limited" : "error",
      latency_ms: Date.now() - perplexityT0,
      error_message: String(e),
      api_requests: 1,
    });
    return serveFallback(svcClient, userId, marketDirectionForCache, undefined, log);
  }

  if (!searchContent) {
    logAttempt({
      companion_type: "ground_nudge",
      provider: "perplexity",
      model: "sonar-pro",
      status: "error",
      latency_ms: Date.now() - perplexityT0,
      error_message: "empty_search_content",
      input_tokens: perplexityMerged?.prompt_tokens,
      output_tokens: perplexityMerged?.completion_tokens,
      api_requests: perplexityApiCalls || 1,
    });
    return serveFallback(svcClient, userId, marketDirectionForCache, undefined, log);
  }

  logAttempt({
    companion_type: "ground_nudge",
    provider: "perplexity",
    model: "sonar-pro",
    status: "success",
    latency_ms: Date.now() - perplexityT0,
    input_tokens: perplexityMerged?.prompt_tokens,
    output_tokens: perplexityMerged?.completion_tokens,
    api_requests: perplexityApiCalls,
  });

  // ── Step 2: AI structuring ──
  log("calling AI structuring");
  const aiBody = {
    messages: [
      {
        role: "system",
        content: `Extract ONE grounding nudge from the search results below.

TONE: Calm, grounding, educational. Like a professor gently explaining why your brain is lying to you right now.
TITLE: Name the bias or finding clearly (5-15 words). Should feel like a section heading in a textbook.
BODY: 2-3 sentences (≤480 characters total, hard ceiling 500) that explain the research finding and why it matters right now. Reference the researchers by name and year. Keep each sentence tight — trim filler before adding a third sentence.
CITATION: Formatted as "Author(s) (Year), Paper Title" — exactly as it appears in the search results.

ACCURACY RULES (CRITICAL):
- Use ONLY facts, names, dates, and numbers from the search results
- Do NOT invent researcher names, years, journals, or statistics
- If the search results are vague, keep the body general
- Copy citation URLs character-for-character from the list

CONNECTION TO THE MOMENT:
- End the body with one sentence connecting the finding to what the user might be feeling RIGHT NOW
- Example: "Recognizing this pattern is the first step to not acting on it."
- This sentence should feel like a gentle mirror, not advice

BITCOIN ONLY:
- Frame everything in terms of Bitcoin holders, not "crypto investors"
- Say "Bitcoin" not "crypto" or "cryptocurrency"
- The user holds Bitcoin specifically — this is not about altcoins or "the crypto market"

BANNED PHRASES — NEVER use any of these: dive into, game-changer, paradigm shift, revolutionary, unprecedented, navigate the, in the world of, it's worth noting, at the end of the day, moving forward, leverage, synergy, ecosystem, disruptive, next-gen, cutting-edge`,
      },
      {
        role: "user",
        content: `Market context: ${marketContext}\n\nSearch results:\n${searchContent}\n\nCitation URLs:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}`,
      },
    ],
    tools: [{
      type: "function" as const,
      function: {
        name: "return_grounding_nudge",
        description: "Return a single grounding nudge extracted from search results",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short bias/finding summary (5-15 words)" },
            body: { type: "string", description: "2-3 sentences referencing researchers and years; ≤480 characters total (hard ceiling 500)" },
            citation: { type: "string", description: "Formatted: Author(s) (Year), Paper Title" },
            url: { type: "string", description: "Citation URL copied character-for-character" },
          },
          required: ["title", "body", "citation", "url"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function" as const, function: { name: "return_grounding_nudge" } },
    temperature: 0.3,
  };

  const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
  type GroundingLiveData = NonNullable<GroundingResult["data"]>;
  let nudge: GroundingLiveData | null = null;
  let lastLovableModel: string | undefined;

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
        logAttempt({ companion_type: "ground_nudge", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: `HTTP ${res.status}` });
        if (model !== models[models.length - 1]) continue; break;
      }

      const data = await res.json();
      const usage = data.usage;
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      const content = toolCall?.function?.arguments || data.choices?.[0]?.message?.content;
      if (!content) {
        logAttempt({ companion_type: "ground_nudge", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: "empty content", input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
        if (model !== models[models.length - 1]) continue; break;
      }

      try {
        nudge = (typeof content === "string" ? JSON.parse(content) : content) as GroundingLiveData;
      } catch {
        const m = (typeof content === "string" ? content : "").match(/\{[\s\S]*\}/);
        if (m) nudge = JSON.parse(m[0]) as GroundingLiveData;
        else {
          logAttempt({ companion_type: "ground_nudge", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: "json_parse_failed", input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
          if (model !== models[models.length - 1]) continue; else break;
        }
      }
      logAttempt({ companion_type: "ground_nudge", provider: "lovable", model, status: "success", latency_ms: Date.now() - attemptT0, input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
      lastLovableModel = model;
      break;
    } catch (e) {
      clearTimeout(aiTimeout);
      logAttempt({ companion_type: "ground_nudge", provider: "lovable", model, status: e instanceof DOMException && e.name === "AbortError" ? "timeout" : "error", latency_ms: Date.now() - attemptT0, error_message: String(e) });
      if (model !== models[models.length - 1]) { log(`${model} failed, retrying`); continue; }
      break;
    }
  }

  // ── Step 3: Quality gate ──
  const qg = qualityGate("ground_nudge", nudge);
  if (!nudge || !qg.pass) {
    const reason = !nudge ? "no_structured_output" : (qg.reason ?? "unknown");
    log(
      `quality gate failed: ${!nudge ? "no nudge" : `body=${(nudge.body || "").length}chars, slop=${containsSlop(nudge?.body || "") || containsSlop(nudge?.title || "")}, reason=${reason}`}`,
    );
    logQualityGateStructuredReject("ground_nudge", reason);
    if (nudge && lastLovableModel) {
      logAttempt({
        companion_type: "ground_nudge",
        provider: "lovable",
        model: lastLovableModel,
        status: "quality_gate_failed",
        latency_ms: 0,
        quality_gate_reason: qg.reason ?? "unknown",
      });
    }
    return serveFallback(svcClient, userId, marketDirectionForCache, undefined, log);
  }

  // ── Step 4: URL post-processing ──
  if (citations.length > 0 && !citations.includes(nudge.url)) {
    nudge.url = citations[0];
  }

  // ── Step 5: Cache write ──
  const qualityScore = 1;
  const cacheQg = qualityGate("ground_nudge", nudge);
  if (nudge.title && nudge.body && nudge.citation && qualityScore > 0 && cacheQg.pass) {
    try {
      const { data: existing } = await svcClient.from("companion_cache").select("content").eq("companion_type", "ground_nudge").eq("language", "en").limit(30);
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      const newNorm = norm(nudge.title);
      const isDup = existing?.some((e: CompanionCacheTitleRow) => {
        const t = norm(e.content?.title || "");
        return t === newNorm || t.includes(newNorm) || newNorm.includes(t);
      });
      if (!isDup) {
        let sourceHost = "";
        try { sourceHost = nudge.url ? new URL(nudge.url.startsWith("http") ? nudge.url : `https://${nudge.url}`).hostname.replace(/^www\./, "") : ""; } catch { /* ignore */ }
        const fingerprint = await contentFingerprint(newNorm);
        const { error: cacheErr } = await svcClient.from("companion_cache").insert({
          companion_type: "ground_nudge",
          language: "en",
          content: nudge,
          quality_score: qualityScore,
          title: nudge.title,
          title_norm: newNorm,
          fingerprint,
          source_kind: "academic_paper",
          source_title: nudge.citation || null,
          source_author: nudge.citation?.split("(")[0]?.trim() || null,
          source_url: nudge.url || null,
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

  const suggestName =
    (nudge.citation && nudge.citation.split("(")[0]?.trim()) ||
    nudge.title;
  void enqueueCatalogSourceSuggestion(svcClient, {
    category: "grounding",
    name: suggestName,
    url: nudge.url,
    pauseInstanceId,
  });

  // ── Step 6: Background URL validation (fire-and-forget) ──
  if (nudge.url && nudge.url.startsWith("http")) {
    isUrlReachable(nudge.url).then(async (reachable) => {
      if (reachable) {
        try {
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
          await svcClient.from("companion_cache")
            .update({ quality_score: 2, last_validated_at: new Date().toISOString() })
            .eq("companion_type", "ground_nudge")
            .eq("title_norm", norm(nudge.title));
        } catch { /* non-critical */ }
      } else {
        log("background URL validation failed", { url: nudge.url });
      }
    }).catch(() => {});
  }

  if (userId) trackEvent(svcClient, userId, "ground_nudge_ai_call");
  return { data: nudge, source: "live", cacheId: null };
}
