/**
 * Reusable signal-generation pipeline.
 *
 * Owns: Perplexity search → AI structuring → quality gate → URL post-processing
 *       → cache write → background URL validation → fallback chain.
 *
 * Does NOT own: HTTP handling, auth, CORS, analytics event tracking.
 * API keys are read from Deno.env directly (same as the original function).
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  qualityGate,
  normalizeUrl,
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
import { fetchInitWithIncomingTrace } from "../forward-trace-headers.ts";
import { validateSource } from "../source-validation.ts";
import { searchLibrary, essayToSignal, recordLibraryServe } from "../content-library.ts";
import { preferNonYoutubeCitationsFirst } from "../recent-signal-urls.ts";
import { getPhaseConfig } from "../phase-config.ts";
import { type CompanionCacheTitleRow } from "../companion-cache-dedup.ts";

/** Bump when the search query, structuring prompt, or quality rules change. */
export const PROMPT_VERSION = "v9";

/**
 * Optional Perplexity denylist entries (leading `-`, e.g. `-example.com`).
 * Leave empty for unrestricted web search when no catalog allowlist is used.
 */
const SIGNAL_DOMAIN_DENYLIST: string[] = [];

/** Normalize citation URLs from Perplexity (drop empties only). */
function filterSignalCitations(urls: string[]): string[] {
  return urls.filter((u) => typeof u === "string" && u.length > 0);
}

/** Shuffle for rotating catalog domains — avoids searching the same 5 hosts every pause. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Rotating sub-themes so similar market context does not always produce the same web query.
 * Keep phrases short; expand here (and bump PROMPT_VERSION) rather than duplicating in docs.
 */
const SIGNAL_EXPLORATION_FACETS = [
  // Time, patience, psychology
  "time preference and delayed gratification",
  "low time preference as emotional skill during volatility",
  "patience and long horizons vs. constant price checking",
  "sitting with uncertainty without needing a trade",
  "identity and self-worth separate from short-term P&L",
  // Monetary theory & ethics
  "sound money and salability across time",
  "hard money vs. soft money (ethical framing, not trading)",
  "monetary debasement and savings — conceptual, not political rant",
  "Cantillon effects and who benefits from inflation (educational)",
  "digital scarcity and predictable issuance (no price targets)",
  // PoW, energy, settlement
  "proof-of-work as unforgeable costliness and truth anchor",
  "energy use as security budget, not apology tour",
  "settlement finality vs. credit and IOUs",
  "open ledger vs. trusted third parties",
  // Sovereignty & agency
  "self-custody as responsibility and agency",
  "verification over trust; running the numbers mentally",
  "neutral protocol vs. corporate or state money",
  "censorship resistance and permissionless access",
  // Network & coordination
  "network effects and monetary Schelling points",
  "decentralization and resilience of the network",
  "Bitcoin as savings technology, not a get-rich scheme",
  // Volatility & reappraisal
  "volatility as feature of free markets and price discovery",
  "fear and greed as signals to pause, not to panic-trade",
  "antifragility — stress that strengthens conviction in the protocol",
  "grounding reactions in fundamentals vs. narrative of the week",
  // History & comparison
  "commodity money and gold — historical parallels without goldbug hype",
  "predictable supply schedule and monetary credibility (not price prediction)",
  "intergenerational thinking — money that outlives quarterly earnings",
  // Protocol & society
  "separation of money and state",
  "open-source money vs. closed platforms",
  "monetary ethics: thrift, saving, and intertemporal fairness",
  "blockspace scarcity and honest fee markets (conceptual)",
] as const;

function pickExplorationFacet(): string {
  const i = Math.floor(Math.random() * SIGNAL_EXPLORATION_FACETS.length);
  return SIGNAL_EXPLORATION_FACETS[i] ?? SIGNAL_EXPLORATION_FACETS[0];
}

function buildSignalPerplexitySystem(recentExclusion: string, topicExclusion: string): string {
  return `You are helping with COGNITIVE REAPPRAISAL in a pause session: find substantive Bitcoin writing that helps someone reframe their reaction to price movement (fear, greed, or calm) — using real ideas from Bitcoin's literature, not trading hype or generic "crypto."

WHAT TO FIND (vary the angle each search):
- Essays and articles from established publishers and authors (e.g. Bitcoin Magazine, Nakamoto Institute, Mises Institute, Unchained, authors like Gigi, Ammous, Farrington, Boyapati, Parker Lewis, Lyn Alden — not exhaustive)
- Themes: sound money, proof-of-work, time preference, settlement, holding, monetary history, ethics of saving, network security

NEVER prioritize or cite:
- Price targets, TA, on-chain hype, altcoins, Ethereum, DeFi, NFTs, "crypto market" framing — BITCOIN ONLY

Summarize faithfully and ground answers in real sources with retrievable URLs.${recentExclusion}${topicExclusion}`;
}

// ── Public types ──

export interface SignalResult {
  data: {
    title: string;
    body: string;
    source: string;
    url: string;
    quote?: string;
  } | null;
  /** `library` = served from `content_library`; `cache` = served from runtime `companion_cache`. Keep
   *  them distinct — they're populated and invalidated separately, and monitoring treats them as
   *  different phases. */
  source: "live" | "library" | "cache" | "curated" | "empty";
  cacheId: string | null;
  /** Set when `serveFromCache` served this row (not library / curated). */
  cacheRelaxation?: CacheServeRelaxation;
  /** Set when source is `empty` (e.g. DISABLE_COMPANION_FALLBACKS + live failure) */
  error?: string;
}

export interface GenerateSignalParams {
  svcClient: SupabaseClient;
  context?: string;
  language?: string;
  sources?: Array<{ name: string; type: string; url?: string }>;
  recentSignalSources?: string[];
  recentSignalTitles?: string[];
  /** Citation URLs already shown recently — exclude from new search (Perplexity prompt). */
  recentSignalUrls?: string[];
  userId?: string;
  pauseInstanceId?: string | null;
  searchAngle?: string;
  /** Skip library/cache phases and go straight to live (used by regenerate). */
  forceLive?: boolean;
  /**
   * Skip the **live** phase only — library and cache still serve. Used by the
   * circuit breaker in companion-orchestrate when the upstream provider is
   * degraded. Ignored when `forceLive` is also true (regenerate still surfaces
   * a breaker-blocked error to the user so the UI can show a retry-later message).
   */
  skipLive?: boolean;
  log: (msg: string, extra?: Record<string, unknown>) => void;
  /** Edge `Request` for W3C trace propagation to Perplexity (companion-orchestrate). */
  incomingRequest?: Request;
}

// ── Internals ──

/** Try content_library (essays) for signal. */
async function tryLibrary(
  svcClient: SupabaseClient,
  userId?: string,
): Promise<SignalResult | null> {
  const libraryRows = await searchLibrary(svcClient, {
    type: "essay",
    companionType: "signal",
    userId,
    includeStale: false,
  });
  if (libraryRows.length > 0) {
    const pick = libraryRows[Math.floor(Math.random() * Math.min(libraryRows.length, 3))];
    const result = essayToSignal(pick);
    recordLibraryServe(svcClient, userId, pick.id, "signal");
    return { data: result, source: "library", cacheId: null };
  }
  return null;
}

/**
 * Try companion_cache for signal.
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
  structuredLog?: GenerateSignalParams["log"],
): Promise<SignalResult | null> {
  const cached = await serveFromCache(svcClient, "signal", "en", {
    userId,
    marketDirection,
    excludeIds,
    strict,
    structuredLog,
  });
  if (cached) {
    return {
      data: cached.data as SignalResult["data"],
      source: "cache",
      cacheId: cached.cacheId,
      cacheRelaxation: cached.relaxation,
    };
  }
  return null;
}

/** Last-resort curated fallback pool. */
async function serveCurated(svcClient: SupabaseClient): Promise<SignalResult> {
  const pool = await loadFallbackPool<{ title: string; body: string; source: string; url: string }>(svcClient, "signal");
  return { data: pickRandom(pool), source: "curated", cacheId: null };
}

/** Resolve from non-live phases in order (library → cache → curated). */
async function serveFallback(
  svcClient: SupabaseClient,
  userId?: string,
  marketDirection?: "up" | "down" | "neutral",
  excludeIds?: string[],
  structuredLog?: GenerateSignalParams["log"],
): Promise<SignalResult> {
  if (companionFallbacksDisabled()) {
    return { data: null, source: "empty", cacheId: null, error: COMPANION_FALLBACKS_DISABLED_MESSAGE };
  }
  const phases = getPhaseConfig();
  if (phases.library) {
    const lib = await tryLibrary(svcClient, userId);
    if (lib) return lib;
  }
  if (phases.cache) {
    const cached = await tryCache(svcClient, userId, marketDirection, excludeIds, false, structuredLog);
    if (cached) return cached;
  }
  return serveCurated(svcClient);
}

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

// ── Public entry point ──

export async function generateSignal(params: GenerateSignalParams): Promise<SignalResult> {
  const {
    svcClient,
    context,
    sources,
    recentSignalSources,
    recentSignalTitles,
    recentSignalUrls,
    userId,
    pauseInstanceId,
    searchAngle,
    forceLive,
    skipLive,
    log,
    incomingRequest,
  } = params;
  const marketDirection = parseMarketDirection(context);
  const phases = getPhaseConfig();
  const liveEnabled = phases.live && !skipLive;

  if (!forceLive) {
  // ── Phase 1: Library ──
  if (phases.library) {
    const lib = await tryLibrary(svcClient, userId);
    if (lib) {
      log("signal resolved from library (phase 1)");
      return lib;
    }
  }

  // ── Phase 2: Cache (strict — no pass-3 repeats; fall through to live if strict pool empty) ──
  if (phases.cache) {
    const cached = await tryCache(svcClient, userId, marketDirection, undefined, true, log);
    if (cached) {
      log("signal resolved from cache (phase 2)");
      return cached;
    }
  }
  } // end !forceLive

  // ── Phase 3: Live generation ──
  if (!liveEnabled && !forceLive) {
    log(skipLive ? "signal: live phase skipped (breaker), serving curated" : "live phase disabled, serving curated");
    if (companionFallbacksDisabled()) {
      return { data: null, source: "empty", cacheId: null, error: COMPANION_FALLBACKS_DISABLED_MESSAGE };
    }
    return serveCurated(svcClient);
  }
  if (skipLive && forceLive) {
    // Regenerate + breaker trip: surface a clear block so the UI can show a
    // retry-later message instead of silently serving curated.
    log("signal: breaker tripped and forceLive requested — returning blocked");
    return { data: null, source: "empty", cacheId: null, error: "circuit_breaker" };
  }

  const logAttempt = createAttemptLogger(svcClient, { userId });

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
    log("missing API keys, serving fallback");
    return serveFallback(svcClient, userId, marketDirection, undefined, log);
  }

  const trimmedSearchAngle = searchAngle?.trim();

  // ── Source hints & exclusions ──
  const { sourceNames, sourceUrls } = buildSourceHints(sources);

  const recentExclusion = (recentSignalSources && recentSignalSources.length > 0)
    ? ` Do NOT use insights from: ${recentSignalSources.slice(0, 5).join(", ")}. Pick a DIFFERENT thinker.`
    : "";
  const topicExclusion = (recentSignalTitles && recentSignalTitles.length > 0)
    ? `\nDo NOT cover these topics (already shown): ${recentSignalTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT angle.`
    : "";
  const sourceHint = sourceNames.length > 0
    ? ` Look for insights from sources like: ${shuffle(sourceNames).slice(0, 5).join(", ")}.`
    : "";

  const urlExclusion = (recentSignalUrls && recentSignalUrls.length > 0)
    ? ` Do NOT cite or use these URLs (already shown in recent pauses): ${recentSignalUrls.slice(0, 16).join(" ")}. Find a different primary source.`
    : "";

  const explorationFacet = pickExplorationFacet();
  const facetSuffix =
    ` Random exploration facet (vary retrieval, still Bitcoin-only): ${explorationFacet}.`;

  // Market direction awareness — different philosophical angles for up vs down
  const isDown = context?.toLowerCase().includes("is down");
  const isUp = context?.toLowerCase().includes("is up");
  const directionHint = isDown
    ? " Focus on conviction, patience, long-term thinking, and the wisdom of holding through difficulty."
    : isUp
    ? " Focus on humility, caution against euphoria, and the discipline of not chasing momentum."
    : "";

  const searchQuery = trimmedSearchAngle
    ? `${trimmedSearchAngle}${sourceHint}${recentExclusion}${urlExclusion}${facetSuffix}`
    : context
    ? `Cognitive reappraisal for a Bitcoin holder when ${context}.${directionHint} Find one high-quality essay or article (sound money, PoW, time preference, holding, settlement, or monetary ethics) from a respected publication or author — not a personal blog.${sourceHint}${recentExclusion}${urlExclusion}${facetSuffix}`
    : `Find one high-quality Bitcoin essay for cognitive reappraisal: sound money, proof-of-work, time preference, holding, or monetary ethics — from a reputable publication or writer; diversify author and domain.${sourceHint}${recentExclusion}${urlExclusion}${facetSuffix}`;

  const perplexitySystem = buildSignalPerplexitySystem(recentExclusion, topicExclusion);

  // Catalog allowlist: rotate which domains each request (fixed slice(0,5) repeated the same hits).
  // Perplexity: temperature/top_p/web_search_context_size per API docs — reduces identical search results.
  const domainFilterForSearch =
    sourceUrls.length > 0
      ? shuffle(sourceUrls).slice(0, Math.min(14, sourceUrls.length))
      : [...SIGNAL_DOMAIN_DENYLIST];

  const hadDomainFilter = domainFilterForSearch.length > 0;

  const perplexityBody: Record<string, unknown> = {
    model: "sonar-pro",
    temperature: 0.62,
    top_p: 0.93,
    web_search_options: { search_context_size: "high" },
    messages: [
      { role: "system", content: perplexitySystem },
      { role: "user", content: searchQuery },
    ],
  };
  if (hadDomainFilter) {
    perplexityBody.search_domain_filter = domainFilterForSearch;
  }

  // ── Step 1: Perplexity search ──
  log("calling perplexity");
  let searchContent = "";
  let citations: string[] = [];

  let perplexityApiCalls = 0;
  let perplexityMerged: ReturnType<typeof mergePerplexityUsage> = undefined;

  const perplexityT0 = Date.now();
  try {
    let apiCalls = 0;
    let mergedUsage = undefined as ReturnType<typeof mergePerplexityUsage>;

    const result = await callPerplexityChat(perplexityBody, PERPLEXITY_API_KEY, (m) => log(m), 15_000, incomingRequest);
    apiCalls++;
    mergedUsage = result.usage;
    searchContent = result.content;
    citations = filterSignalCitations(result.citations);
    log(`perplexity content length: ${searchContent.length}, citations after filter: ${citations.length}`);

    if (citations.length === 0 && sourceUrls.length > 0 && searchContent.length > 0) {
      log("0 citations after merge — retrying without domain filter");
      const retryBody = { ...perplexityBody };
      delete retryBody.search_domain_filter;
      try {
        const retry = await callPerplexityChat(retryBody, PERPLEXITY_API_KEY, (m) => log(m), 15_000, incomingRequest);
        apiCalls++;
        mergedUsage = mergePerplexityUsage(mergedUsage, retry.usage);
        if (retry.citations.length > 0) {
          searchContent = retry.content;
          citations = filterSignalCitations(retry.citations);
          log(`retry got ${citations.length} citations after filter`);
        }
      } catch { log("retry failed, using original content"); }
    }

    if (citations.length === 0 && hadDomainFilter && sourceUrls.length === 0 && searchContent.length > 0) {
      log("0 usable citations — retrying Perplexity without search_domain_filter");
      const retryWide = { ...perplexityBody };
      delete retryWide.search_domain_filter;
      try {
        const wide = await callPerplexityChat(retryWide, PERPLEXITY_API_KEY, (m) => log(m), 15_000, incomingRequest);
        apiCalls++;
        mergedUsage = mergePerplexityUsage(mergedUsage, wide.usage);
        searchContent = wide.content;
        citations = filterSignalCitations(wide.citations);
        log(`wide retry: citations after filter: ${citations.length}`);
      } catch { log("wide retry failed"); }
    }

    if (citations.length === 0 && searchContent.length > 0) {
      log("perplexity: still no citation URLs after merge + retries — literature exists; API metadata may be sparse");
    }

    perplexityApiCalls = apiCalls;
    perplexityMerged = mergedUsage;
  } catch (e) {
    log(`perplexity failed: ${e}`);
    logAttempt({
      companion_type: "signal",
      provider: "perplexity",
      model: "sonar-pro",
      status: String(e).includes("RATE_LIMITED") ? "rate_limited" : "error",
      latency_ms: Date.now() - perplexityT0,
      error_message: String(e),
      api_requests: 1,
    });
    return serveFallback(svcClient, userId, marketDirection, undefined, log);
  }

  citations = preferNonYoutubeCitationsFirst(citations);

  if (!searchContent) {
    logAttempt({
      companion_type: "signal",
      provider: "perplexity",
      model: "sonar-pro",
      status: "error",
      latency_ms: Date.now() - perplexityT0,
      error_message: "empty_search_content",
      input_tokens: perplexityMerged?.prompt_tokens,
      output_tokens: perplexityMerged?.completion_tokens,
      api_requests: perplexityApiCalls || 1,
    });
    return serveFallback(svcClient, userId, marketDirection, undefined, log);
  }

  logAttempt({
    companion_type: "signal",
    provider: "perplexity",
    model: "sonar-pro",
    status: "success",
    latency_ms: Date.now() - perplexityT0,
    input_tokens: perplexityMerged?.prompt_tokens,
    output_tokens: perplexityMerged?.completion_tokens,
    api_requests: perplexityApiCalls,
  });

  if (citations.length === 0) {
    log("perplexity returned no citation URLs — skipping live structuring to avoid invented attributions");
    logAttempt({
      companion_type: "signal",
      provider: "perplexity",
      model: "sonar-pro",
      status: "error",
      latency_ms: Date.now() - perplexityT0,
      error_message: "no_citations",
      input_tokens: perplexityMerged?.prompt_tokens,
      output_tokens: perplexityMerged?.completion_tokens,
      api_requests: perplexityApiCalls,
    });
    return serveFallback(svcClient, userId, marketDirection, undefined, log);
  }

  // ── Step 2: AI structuring ──
  const citationList = citations.length > 0
    ? citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")
    : "(No citations available — leave url empty)";

  log("calling AI structuring");

  const aiBody = {
    messages: [
      {
        role: "system",
        content: `Extract ONE Bitcoin insight from the search results for COGNITIVE REAPPRAISAL: help the reader reframe fear, greed, or calm about price using ideas from the text — not trading advice.

TONE: Profound, calm, grounding. Like a wise friend reminding you why you hold.
TITLE: Evocative, poetic, 5-10 words. Should read like a book chapter title, not a headline.
BODY: 2-3 sentences capturing the philosophical ESSENCE — not a summary. Distill the core idea.
QUOTE (optional): If the search results contain a memorable direct quote from the thinker (1 sentence max), include it. Must be a REAL quote from the search results — do NOT fabricate. Leave empty if no direct quote is found.

GOOD TITLES: "Proof of work is proof of sacrifice" / "Sound money teaches patience before wealth" / "Settlement is the antidote to narrative"
BAD TITLES: "Bitcoin hash rate reaches new high" / "Analyst predicts BTC target" / anything with numbers or dates

ACCURACY RULES (CRITICAL):
- The "source" field must be the REAL author's name as it appears in the search results
- If the search results say "Parker Lewis writes..." then source = "Parker Lewis"
- If you cannot identify a SINGLE author with confidence, use the publication name from the citation URL (e.g. "Bitcoin Magazine", "Nakamoto Institute")
- Do NOT invent author names or combine multiple authors
- Do NOT use generic attributions like "Bitcoin thinkers" or "various authors"
- The body distills the philosophical point — no data regurgitation

BITCOIN ONLY — CRITICAL:
- This is about BITCOIN, not "crypto" or "blockchain" in general
- NEVER use the words: crypto, cryptocurrency, altcoin, token, blockchain technology, Web3, DeFi
- Always say "Bitcoin" — never generalize to "crypto market" or "digital assets"

BANNED PHRASES — NEVER use any of these: dive into, game-changer, paradigm shift, revolutionary, unprecedented, navigate the, in the world of, it's worth noting, at the end of the day, moving forward, leverage, synergy, ecosystem, disruptive, next-gen, cutting-edge

URL RULES (CRITICAL):
- Pick a url from the citation list below. Copy it character-for-character.
- If none match, use the FIRST citation URL.
- If no citations exist, set url to "".
- NEVER fabricate URLs.`,
      },
      {
        role: "user",
        content: `Search results:\n${searchContent}\n\nCitation URLs (pick one EXACTLY):\n${citationList}`,
      },
    ],
    tools: [{
      type: "function" as const,
      function: {
        name: "return_signal",
        description: "Return a single philosophical Bitcoin insight",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Evocative 5-10 word philosophical headline" },
            body: { type: "string", description: "2-3 sentences capturing the philosophical essence" },
            source: { type: "string", description: "Thinker, writer, or publication name" },
            url: { type: "string", description: "Citation URL copied character-for-character" },
            quote: { type: "string", description: "Optional: a real direct quote from the thinker (1 sentence, from search results only)" },
          },
          required: ["title", "body", "source", "url"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function" as const, function: { name: "return_signal" } },
    temperature: 0.35,
  };

  const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
  type SignalLiveData = NonNullable<SignalResult["data"]>;
  let signal: SignalLiveData | null = null;
  let lastLovableModel: string | undefined;

  const AI_TIMEOUTS = [8000, 6000];
  for (let idx = 0; idx < models.length; idx++) {
    const model = models[idx];
    const aiController = new AbortController();
    const aiTimeout = setTimeout(() => aiController.abort(), AI_TIMEOUTS[idx]);
    const attemptT0 = Date.now();
    try {
      const structureResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        fetchInitWithIncomingTrace(incomingRequest, {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...aiBody, model }),
          signal: aiController.signal,
        }),
      );
      clearTimeout(aiTimeout);
      log(`AI ${model} responded ${structureResponse.status}`);

      if (!structureResponse.ok) {
        await structureResponse.text();
        logAttempt({ companion_type: "signal", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: `HTTP ${structureResponse.status}` });
        if (model !== models[models.length - 1]) { log("Retrying with fallback model"); continue; }
        break;
      }

      const structureData = await structureResponse.json();
      const usage = structureData.usage;
      const toolCall = structureData.choices?.[0]?.message?.tool_calls?.[0];
      const content = toolCall?.function?.arguments || structureData.choices?.[0]?.message?.content;
      if (!content) {
        logAttempt({ companion_type: "signal", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: "empty content", input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
        if (model !== models[models.length - 1]) continue;
        break;
      }

      try {
        signal = (typeof content === "string" ? JSON.parse(content) : content) as SignalLiveData;
      } catch {
        const m = (typeof content === "string" ? content : "").match(/\{[\s\S]*\}/);
        if (m) signal = JSON.parse(m[0]) as SignalLiveData;
        else {
          logAttempt({ companion_type: "signal", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: "json_parse_failed", input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
          if (model !== models[models.length - 1]) continue; else break;
        }
      }
      logAttempt({ companion_type: "signal", provider: "lovable", model, status: "success", latency_ms: Date.now() - attemptT0, input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
      lastLovableModel = model;
      break;
    } catch (e) {
      clearTimeout(aiTimeout);
      logAttempt({ companion_type: "signal", provider: "lovable", model, status: e instanceof DOMException && e.name === "AbortError" ? "timeout" : "error", latency_ms: Date.now() - attemptT0, error_message: String(e) });
      if (model !== models[models.length - 1]) { log(`${model} failed, retrying`); continue; }
      break;
    }
  }

  // ── Step 3: Quality gate ──
  const qg = qualityGate("signal", signal);
  if (!signal || !qg.pass) {
    const reason = !signal ? "no_structured_output" : (qg.reason ?? "unknown");
    log(`quality gate failed: ${reason}`);
    logQualityGateStructuredReject("signal", reason);
    if (signal && lastLovableModel) {
      logAttempt({
        companion_type: "signal",
        provider: "lovable",
        model: lastLovableModel,
        status: "quality_gate_failed",
        latency_ms: 0,
        quality_gate_reason: qg.reason ?? "unknown",
      });
    }
    return serveFallback(svcClient, userId, marketDirection, undefined, log);
  }

  // ── Step 4: URL post-processing ──
  const aiUrl = signal.url || "";
  const exactMatch = citations.find((c) => c === aiUrl);
  if (exactMatch) {
    signal.url = exactMatch;
  } else {
    try {
      const partialMatch = aiUrl
        ? citations.find((c) => c.includes(new URL(normalizeUrl(aiUrl)).hostname))
        : null;
      signal.url = partialMatch || (citations.length > 0 ? citations[0] : "");
    } catch {
      signal.url = citations.length > 0 ? citations[0] : "";
    }
  }

  if (signal.url && !signal.url.startsWith("http")) {
    signal.url = normalizeUrl(signal.url);
  }

  // ── Step 4b: Source attribution validation ──
  // Cross-reference the AI's source against known authors and citation URLs
  const originalSource = signal.source;
  signal.source = validateSource(signal.source, signal.url || "", citations, sources);
  if (signal.source !== originalSource) {
    log(`source corrected: "${originalSource}" → "${signal.source}"`);
  }

  // ── Step 5: Cache write ──
  const qualityScore = 1;
  if (signal.title && signal.body && signal.source && qualityScore > 0) {
    try {
      const { data: existing } = await svcClient
        .from("companion_cache")
        .select("content")
        .eq("companion_type", "signal")
        .eq("language", "en")
        .limit(30);
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      const newNorm = norm(signal.title);
      const isDup = existing?.some((e: CompanionCacheTitleRow) => {
        const t = norm(e.content?.title || "");
        return t === newNorm || t.includes(newNorm) || newNorm.includes(t);
      });
      if (!isDup) {
        let sourceHost = "";
        try {
          sourceHost = signal.url
            ? new URL(signal.url.startsWith("http") ? signal.url : `https://${signal.url}`).hostname.replace(/^www\./, "")
            : "";
        } catch { /* ignore */ }
        const fingerprint = await contentFingerprint(newNorm);
        const { error: cacheErr } = await svcClient.from("companion_cache").insert({
          companion_type: "signal",
          language: "en",
          content: signal,
          quality_score: qualityScore,
          title: signal.title,
          title_norm: newNorm,
          fingerprint,
          source_kind: "essay",
          source_title: signal.source || null,
          source_author: signal.source || null,
          source_url: signal.url || null,
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

  void enqueueCatalogSourceSuggestion(svcClient, {
    category: "signal",
    name: signal.source,
    url: signal.url,
    pauseInstanceId,
  });

  // ── Step 6: Background URL validation (fire-and-forget) ──
  if (signal.url && signal.url.startsWith("http")) {
    isUrlReachable(signal.url).then(async (reachable) => {
      if (reachable) {
        try {
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
          const titleNorm = norm(signal.title);
          await svcClient.from("companion_cache")
            .update({ quality_score: 2, last_validated_at: new Date().toISOString() })
            .eq("companion_type", "signal")
            .eq("title_norm", titleNorm);
        } catch { /* non-critical */ }
      } else {
        log("background URL validation failed", { url: signal.url });
      }
    }).catch(() => {});
  }

  if (userId) trackEvent(svcClient, userId, "signal_companion_ai_call");
  return { data: signal, source: "live", cacheId: null };
}
