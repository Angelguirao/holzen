/**
 * Reusable signal-generation pipeline.
 *
 * Owns: Perplexity search → AI structuring → quality gate → URL post-processing
 *       → cache write → background URL validation → fallback chain.
 *
 * Does NOT own: HTTP handling, auth, CORS, analytics event tracking.
 * API keys are read from Deno.env directly (same as the original function).
 */

import { qualityGate, normalizeUrl, isUrlReachable, contentFingerprint } from "../quality.ts";
import { loadFallbackPool, pickRandom } from "../fallbacks.ts";
import { parseMarketDirection, serveFromCache } from "../cache.ts";
import { createAttemptLogger } from "../observe.ts";
import { callPerplexityChat, mergePerplexityUsage } from "../perplexity-client.ts";
import { validateSource } from "../source-validation.ts";
import { searchLibrary, essayToSignal, recordLibraryServe } from "../content-library.ts";

/** Bump when the search query, structuring prompt, or quality rules change. */
export const PROMPT_VERSION = "v2";

// ── Public types ──

export interface SignalResult {
  data: { title: string; body: string; source: string; url: string } | null;
  source: "live" | "cache" | "curated";
  cacheId: string | null;
}

export interface GenerateSignalParams {
  svcClient: any;
  context?: string;
  language?: string;
  sources?: Array<{ name: string; type: string; url?: string }>;
  recentSignalSources?: string[];
  recentSignalTitles?: string[];
  userId?: string;
  searchAngle?: string;
  log: (msg: string, extra?: Record<string, unknown>) => void;
}

// ── Internals ──

async function serveFallback(
  svcClient: any,
  userId?: string,
  marketDirection?: "up" | "down" | "neutral",
  excludeIds?: string[],
): Promise<SignalResult> {
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
    return { data: result, source: "cache", cacheId: null };
  }
  const cached = await serveFromCache(svcClient, "signal", "en", { userId, marketDirection, excludeIds });
  if (cached) return { data: cached.data, source: "cache", cacheId: cached.cacheId };
  const pool = await loadFallbackPool<{ title: string; body: string; source: string; url: string }>(svcClient, "signal");
  return { data: pickRandom(pool), source: "curated", cacheId: null };
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
  const { svcClient, context, sources, recentSignalSources, recentSignalTitles, userId, searchAngle, log } = params;
  const marketDirection = parseMarketDirection(context);

  const logAttempt = createAttemptLogger(svcClient, { userId });

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
    log("missing API keys, serving fallback");
    return serveFallback(svcClient, userId, marketDirection);
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
    ? ` Look for insights from sources like: ${sourceNames.sort(() => Math.random() - 0.5).slice(0, 5).join(", ")}.`
    : "";

  // Market direction awareness — different philosophical angles for up vs down
  const isDown = context?.toLowerCase().includes("is down");
  const isUp = context?.toLowerCase().includes("is up");
  const directionHint = isDown
    ? " Focus on conviction, patience, long-term thinking, and the wisdom of holding through difficulty."
    : isUp
    ? " Focus on humility, caution against euphoria, and the discipline of not chasing momentum."
    : "";

  const searchQuery = trimmedSearchAngle
    ? `${trimmedSearchAngle}${sourceHint}${recentExclusion}`
    : context
    ? `Bitcoin philosophical perspective relevant when ${context}.${directionHint} Find a profound insight from a respected Bitcoin thinker or writer.${sourceHint}${recentExclusion}`
    : `Find a profound, philosophical Bitcoin essay or insight about sovereignty, sound money, time preference, proof of work as philosophy, or the meaning of holding from a respected thinker.${sourceHint}${recentExclusion}`;

  const perplexityBody: any = {
    model: "sonar-pro",
    messages: [
      {
        role: "system",
        content: `You are searching for deep, philosophical Bitcoin writing — essays and ideas that make a holder feel grounded in WHY they hold.

WHAT TO SEARCH FOR:
- Deep ideas about what Bitcoin represents for human freedom, sovereignty, and self-custody
- Philosophical perspectives on money, time preference, proof of work as a life principle
- Long-form thinking from Bitcoin writers, philosophers, economists
- Perspectives on sound money, Austrian economics, game theory, civilizational impact

WHAT TO AVOID:
- Price predictions, chart analysis, trading setups
- On-chain metrics, hash rate stats, exchange flows
- Short-term market commentary or news
- Generic "crypto" or "blockchain" content — this is BITCOIN ONLY
- Altcoins, Ethereum, DeFi, NFTs, tokens, Web3 — NEVER mention these
- "Crypto market" framing — always say "Bitcoin", never "crypto"

IDEAL SOURCES: Bitcoin Magazine, Nakamoto Institute, Allen Farrington, Vijay Boyapati, Lyn Alden, Parker Lewis, Gigi, Robert Breedlove, Saifedean Ammous, Jeff Booth, Knut Svanholm

DIVERSITY: Use a DIFFERENT thinker every time. Prefer timeless essays over recent posts.${recentExclusion}${topicExclusion}`,
      },
      { role: "user", content: searchQuery },
    ],
    // No recency filter — Bitcoin philosophy is timeless. Essays from 2018 are as valuable as 2025.
    ...(sourceUrls.length > 0 ? { search_domain_filter: sourceUrls.slice(0, 5) } : {}),
  };

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

    const result = await callPerplexityChat(perplexityBody, PERPLEXITY_API_KEY, (m) => log(m));
    apiCalls++;
    mergedUsage = result.usage;
    searchContent = result.content;
    citations = result.citations;
    log(`perplexity content length: ${searchContent.length}, citations: ${citations.length}`);

    if (citations.length === 0 && sourceUrls.length > 0 && searchContent.length > 0) {
      log("0 citations with domain filter — retrying without filter");
      const retryBody = { ...perplexityBody };
      delete retryBody.search_domain_filter;
      try {
        const retry = await callPerplexityChat(retryBody, PERPLEXITY_API_KEY, (m) => log(m));
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
      companion_type: "signal",
      provider: "perplexity",
      model: "sonar-pro",
      status: String(e).includes("RATE_LIMITED") ? "rate_limited" : "error",
      latency_ms: Date.now() - perplexityT0,
      error_message: String(e),
      api_requests: 1,
    });
    return serveFallback(svcClient, userId, marketDirection);
  }

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
    return serveFallback(svcClient, userId, marketDirection);
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

  // ── Step 2: AI structuring ──
  const citationList = citations.length > 0
    ? citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")
    : "(No citations available — leave url empty)";

  log("calling AI structuring");

  const aiBody = {
    messages: [
      {
        role: "system",
        content: `Extract ONE philosophical Bitcoin insight from the search results below.

TONE: Profound, calm, grounding. Like a wise friend reminding you why you hold.
TITLE: Evocative, poetic, 5-10 words. Should read like a book chapter title, not a headline.
BODY: 2-3 sentences capturing the philosophical ESSENCE — not a summary. Distill the core idea.
QUOTE (optional): If the search results contain a memorable direct quote from the thinker (1 sentence max), include it. Must be a REAL quote from the search results — do NOT fabricate. Leave empty if no direct quote is found.

GOOD TITLES: "Proof of work is proof of sacrifice" / "Sound money teaches patience before wealth" / "Sovereignty begins with what you refuse to delegate"
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
    temperature: 0.5,
  };

  const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
  let signal: any = null;

  const AI_TIMEOUTS = [8000, 6000];
  for (let idx = 0; idx < models.length; idx++) {
    const model = models[idx];
    const aiController = new AbortController();
    const aiTimeout = setTimeout(() => aiController.abort(), AI_TIMEOUTS[idx]);
    const attemptT0 = Date.now();
    try {
      const structureResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...aiBody, model }),
        signal: aiController.signal,
      });
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
        signal = typeof content === "string" ? JSON.parse(content) : content;
      } catch {
        const m = (typeof content === "string" ? content : "").match(/\{[\s\S]*\}/);
        if (m) signal = JSON.parse(m[0]);
        else {
          logAttempt({ companion_type: "signal", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: "json_parse_failed", input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
          if (model !== models[models.length - 1]) continue; else break;
        }
      }
      logAttempt({ companion_type: "signal", provider: "lovable", model, status: "success", latency_ms: Date.now() - attemptT0, input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
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
    log(`quality gate failed: ${!signal ? "no signal" : (qg.reason ?? "unknown")}`);
    return serveFallback(svcClient, userId, marketDirection);
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
  signal.source = validateSource(signal.source, signal.url || "", citations, sources as any);
  if (signal.source !== originalSource) {
    log(`source corrected: "${originalSource}" → "${signal.source}"`);
  }

  // ── Step 5: Cache write ──
  let qualityScore = 1;
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
      const isDup = existing?.some((e: any) => {
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

  return { data: signal, source: "live", cacheId: null };
}
