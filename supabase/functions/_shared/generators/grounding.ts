/**
 * Reusable grounding-nudge generation pipeline.
 *
 * Owns: Perplexity academic search → AI structuring → quality gate → URL post-processing
 *       → cache write → background URL validation → fallback chain.
 *
 * Does NOT own: HTTP handling, auth, CORS, analytics event tracking.
 * API keys are read from Deno.env directly (same as the original function).
 */

import { qualityGate, containsSlop, isUrlReachable, contentFingerprint } from "../quality.ts";
import { GROUNDING_FALLBACKS, pickRandom } from "../fallbacks.ts";
import { serveFromCache } from "../cache.ts";
import { createAttemptLogger } from "../observe.ts";

// ── Public types ──

export interface GroundingResult {
  data: { title: string; body: string; citation: string; url: string } | null;
  source: "live" | "cache" | "curated";
  cacheId: string | null;
}

export interface GenerateGroundingParams {
  svcClient: any;
  context?: string;
  language?: string;
  recentTopics?: string[];
  userId?: string;
  log: (msg: string, extra?: Record<string, unknown>) => void;
}

// ── Internals ──

const BIAS_TOPICS = [
  "loss aversion and panic selling during market drops",
  "FOMO and herding behavior during market rallies",
  "disposition effect — selling winners too early and holding losers too long",
  "anchoring bias and mental accounting in investment decisions",
  "emotional regulation and prefrontal cortex function during financial stress",
  "endowment effect and status quo bias in portfolio management",
  "recency bias and availability heuristic in market predictions",
  "overconfidence bias and illusion of control in trading decisions",
  "regret aversion and its effect on long-term investment holding",
  "social proof and information cascading in crypto markets",
];

async function serveFallback(
  svcClient: any,
  excludeIds?: string[],
): Promise<GroundingResult> {
  const cached = await serveFromCache(svcClient, "ground_nudge", "en", excludeIds);
  if (cached) return { data: cached.data, source: "cache", cacheId: cached.cacheId };
  return { data: pickRandom(GROUNDING_FALLBACKS), source: "curated", cacheId: null };
}

async function callPerplexity(
  pBody: any,
  apiKey: string,
  log: GenerateGroundingParams["log"],
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

export async function generateGrounding(params: GenerateGroundingParams): Promise<GroundingResult> {
  const { svcClient, context, recentTopics, userId, log } = params;

  const logAttempt = createAttemptLogger(svcClient, { userId });

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
    log("missing API keys, serving fallback");
    return serveFallback(svcClient);
  }

  // ── Bias topic selection, avoiding recently used ones ──
  const recentSet = new Set((recentTopics || []).map((t: string) => t.toLowerCase()));
  const available = BIAS_TOPICS.filter(t => !recentSet.has(t.toLowerCase()));
  const pool = available.length > 0 ? available : BIAS_TOPICS;
  const randomBias = pool[Math.floor(Math.random() * pool.length)];

  const marketContext = context || "Bitcoin market volatility";
  const searchQuery = `Find a specific academic study or research paper about ${randomBias}. The research should be relevant to: ${marketContext}. Include the researcher names, university, year of publication, sample size or key methodology detail, and the main finding. Prefer peer-reviewed journals.`;

  // ── Step 1: Perplexity academic search ──
  log("calling perplexity");
  let searchContent = "";
  let citations: string[] = [];

  try {
    const result = await callPerplexity({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: "You are a behavioral finance research assistant. Search for real, specific academic research papers. Return ONE specific study with exact researcher names, publication year, journal name, and quantitative findings. Prefer lesser-known but fascinating studies over the most commonly cited ones.",
        },
        { role: "user", content: searchQuery },
      ],
      search_mode: "academic",
    }, PERPLEXITY_API_KEY, log);
    searchContent = result.content;
    citations = result.citations;
    log(`content length: ${searchContent.length}, citations: ${citations.length}`);
  } catch (e) {
    log(`perplexity failed: ${e}`);
    return serveFallback(svcClient);
  }

  if (!searchContent) {
    return serveFallback(svcClient);
  }

  // ── Step 2: AI structuring ──
  log("calling AI structuring");
  const aiBody = {
    messages: [
      {
        role: "system",
        content: `Extract ONE grounding nudge from the search results below.

TONE: Calm, grounding, educational. Like a professor gently explaining why your brain is lying to you right now.
TITLE: Name the bias or finding clearly (5-15 words). Should feel like a section heading in a textbook.
BODY: 2-3 sentences that explain the research finding and why it matters right now. Reference the researchers by name and year.
CITATION: Formatted as "Author(s) (Year), Paper Title" — exactly as it appears in the search results.

ACCURACY RULES (CRITICAL):
- Use ONLY facts, names, dates, and numbers from the search results
- Do NOT invent researcher names, years, journals, or statistics
- If the search results are vague, keep the body general
- Copy citation URLs character-for-character from the list

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
            body: { type: "string", description: "2-3 sentences referencing researchers and years" },
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

  const models = ["google/gemini-2.5-flash", "google/gemini-3-flash-preview"];
  let nudge: any = null;

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
        nudge = typeof content === "string" ? JSON.parse(content) : content;
      } catch {
        const m = (typeof content === "string" ? content : "").match(/\{[\s\S]*\}/);
        if (m) nudge = JSON.parse(m[0]);
        else {
          logAttempt({ companion_type: "ground_nudge", provider: "lovable", model, status: "error", latency_ms: Date.now() - attemptT0, error_message: "json_parse_failed", input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
          if (model !== models[models.length - 1]) continue; else break;
        }
      }
      logAttempt({ companion_type: "ground_nudge", provider: "lovable", model, status: "success", latency_ms: Date.now() - attemptT0, input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
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
    log(`quality gate failed: ${!nudge ? "no nudge" : `body=${(nudge.body || "").length}chars, slop=${containsSlop(nudge?.body || "") || containsSlop(nudge?.title || "")}, reason=${qg.reason ?? "unknown"}`}`);
    return serveFallback(svcClient);
  }

  // ── Step 4: URL post-processing ──
  if (citations.length > 0 && !citations.includes(nudge.url)) {
    nudge.url = citations[0];
  }

  // ── Step 5: Cache write ──
  let qualityScore = 1;
  const cacheQg = qualityGate("ground_nudge", nudge);
  if (nudge.title && nudge.body && nudge.citation && qualityScore > 0 && cacheQg.pass) {
    try {
      const { data: existing } = await svcClient.from("companion_cache").select("content").eq("companion_type", "ground_nudge").eq("language", "en").limit(30);
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      const newNorm = norm(nudge.title);
      const isDup = existing?.some((e: any) => {
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

  return { data: nudge, source: "live", cacheId: null };
}
