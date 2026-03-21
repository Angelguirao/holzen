import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createAuthenticatedClient, createServiceClient } from "../_shared/auth.ts";
import { qualityGate, normalizeUrl, isUrlReachable } from "../_shared/quality.ts";
import { createAttemptLogger, createObsTracker, createLogger } from "../_shared/observe.ts";
import { SIGNAL_FALLBACKS, pickRandom } from "../_shared/fallbacks.ts";
import { serveFromCache } from "../_shared/cache.ts";

/** Cache (ranked) → curated fallbacks. */
async function serveFallback(svcClient: any, excludeIds?: string[]): Promise<{ data: any; source: string; cacheId: string | null }> {
  const cached = await serveFromCache(svcClient, "signal", "en", excludeIds);
  if (cached) return { data: cached.data, source: "cache", cacheId: cached.cacheId };
  return { data: pickRandom(SIGNAL_FALLBACKS), source: "curated", cacheId: null };
}

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const t0 = Date.now();
  const log = createLogger("signal");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Unauthorized", 401);
    }

    let body: any = {};
    try { body = await req.json(); } catch {
      return errorResponse("Invalid or empty request body", 400);
    }
    const { context, sources, recentSignalSources, recentSignalTitles } = body;
    log("parsed body");

    const sbClient = await createAuthenticatedClient(authHeader);
    const { data: { user }, error: authError } = await sbClient.auth.getUser();
    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }
    log("auth verified");

    const svcClient = await createServiceClient();
    svcClient.from("analytics_events").insert({ user_id: user.id, event: "signal_companion_ai_call" }).then(() => {});

    const trackObs = createObsTracker(svcClient, user.id, "signal", t0);
    const logAttempt = createAttemptLogger(svcClient, { userId: user.id });

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
      log("missing API keys, serving fallback");
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated");
      return jsonResponse({ ...fb.data, _cache_id: fb.cacheId, _serve_source: fb.source });
    }

    // Build source hints
    const sourceNames: string[] = [];
    const sourceUrls: string[] = [];
    if (sources && Array.isArray(sources)) {
      for (const s of sources) {
        if (s.name) sourceNames.push(s.name);
        if (s.url && typeof s.url === "string") {
          try {
            const hostname = new URL(s.url.startsWith("http") ? s.url : `https://${s.url}`).hostname.replace(/^www\./, "");
            if (hostname && !sourceUrls.includes(hostname)) sourceUrls.push(hostname);
          } catch { /* skip */ }
        }
      }
    }

    const recentExclusion = (recentSignalSources?.length > 0)
      ? ` Do NOT use insights from: ${recentSignalSources.slice(0, 5).join(", ")}. Pick a DIFFERENT thinker.`
      : "";
    const topicExclusion = (recentSignalTitles?.length > 0)
      ? `\nDo NOT cover these topics (already shown): ${recentSignalTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT angle.`
      : "";
    const sourceHint = sourceNames.length > 0
      ? ` Look for insights from sources like: ${sourceNames.sort(() => Math.random() - 0.5).slice(0, 5).join(", ")}.`
      : "";

    const searchQuery = context
      ? `Bitcoin philosophical perspective relevant when ${context}. Find a profound insight about conviction, patience, sound money, sovereignty, or long-term thinking from a respected Bitcoin thinker or writer.${sourceHint}${recentExclusion}`
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

IDEAL SOURCES: Bitcoin Magazine, Nakamoto Institute, Allen Farrington, Vijay Boyapati, Lyn Alden, Parker Lewis, Gigi, Robert Breedlove, Saifedean Ammous, Jeff Booth, Knut Svanholm

DIVERSITY: Use a DIFFERENT thinker every time. Prefer timeless essays over recent posts.${recentExclusion}${topicExclusion}`,
        },
        { role: "user", content: searchQuery },
      ],
      search_recency_filter: "year",
      ...(sourceUrls.length > 0 ? { search_domain_filter: sourceUrls.slice(0, 5) } : {}),
    };

    // ── Step 1: Perplexity search ──
    async function callPerplexity(pBody: any): Promise<{ content: string; citations: string[] }> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const res = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(pBody),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        log(`perplexity responded ${res.status}`);
        if (!res.ok) {
          const errText = await res.text();
          console.error("Perplexity error:", res.status, errText);
          if (res.status === 429) throw new Error("RATE_LIMITED");
          throw new Error("Perplexity search failed");
        }
        const data = await res.json();
        return { content: data.choices?.[0]?.message?.content || "", citations: data.citations || [] };
      } catch (e) {
        clearTimeout(timeout);
        throw e;
      }
    }

    log("calling perplexity");
    let searchContent = "";
    let citations: string[] = [];

    try {
      const result = await callPerplexity(perplexityBody);
      searchContent = result.content;
      citations = result.citations;
      log(`perplexity content length: ${searchContent.length}, citations: ${citations.length}`);

      if (citations.length === 0 && sourceUrls.length > 0 && searchContent.length > 0) {
        log("0 citations with domain filter — retrying without filter");
        const retryBody = { ...perplexityBody };
        delete retryBody.search_domain_filter;
        try {
          const retry = await callPerplexity(retryBody);
          if (retry.citations.length > 0) {
            searchContent = retry.content;
            citations = retry.citations;
            log(`retry got ${citations.length} citations`);
          }
        } catch { log("retry failed, using original content"); }
      }
    } catch (e) {
      log(`perplexity failed: ${e}`);
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated");
      return jsonResponse({ ...fb.data, _cache_id: fb.cacheId, _serve_source: fb.source });
    }

    if (!searchContent) {
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated");
      return jsonResponse({ ...fb.data, _cache_id: fb.cacheId, _serve_source: fb.source });
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
          content: `Extract ONE philosophical Bitcoin insight from the search results below.

TONE: Profound, calm, grounding. Like a wise friend reminding you why you hold.
TITLE: Evocative, poetic, 5-10 words. Should read like a book chapter title, not a headline.
BODY: 2-3 sentences capturing the philosophical ESSENCE — not a summary. Distill the core idea.

GOOD TITLES: "Proof of work is proof of sacrifice" / "Sound money teaches patience before wealth" / "Sovereignty begins with what you refuse to delegate"
BAD TITLES: "Bitcoin hash rate reaches new high" / "Analyst predicts BTC target" / anything with numbers or dates

ACCURACY RULES (CRITICAL):
- Attribute ideas to the correct thinker from the search results
- Do NOT invent quotes or misattribute ideas
- The body distills the philosophical point — no data regurgitation

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
        type: "function",
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
            },
            required: ["title", "body", "source", "url"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_signal" } },
      temperature: 0.5,
    };

    const models = ["google/gemini-2.5-flash", "google/gemini-3-flash-preview"];
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

    const qg = qualityGate("signal", signal);
    if (!signal || !qg.pass) {
      log(`quality gate failed: ${!signal ? "no signal" : (qg.reason ?? "unknown")}`);
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated", { reason: "quality_gate" });
      return jsonResponse({ ...fb.data, _cache_id: fb.cacheId, _serve_source: fb.source });
    }

    // ── Post-processing: URL validation ──
    const aiUrl = signal.url || "";
    const exactMatch = citations.find((c) => c === aiUrl);
    if (exactMatch) {
      signal.url = exactMatch;
    } else {
      try {
        const partialMatch = aiUrl ? citations.find((c) => c.includes(new URL(normalizeUrl(aiUrl)).hostname)) : null;
        signal.url = partialMatch || (citations.length > 0 ? citations[0] : "");
      } catch {
        signal.url = citations.length > 0 ? citations[0] : "";
      }
    }

    if (signal.url && !signal.url.startsWith("http")) {
      signal.url = normalizeUrl(signal.url);
    }

    let qualityScore = 1;
    if (signal.url) {
      const reachable = await isUrlReachable(signal.url);
      if (!reachable) {
        let found = false;
        for (const c of citations) {
          if (c !== signal.url && await isUrlReachable(c)) {
            signal.url = c;
            found = true;
            break;
          }
        }
        if (!found) {
          const searchTerm = encodeURIComponent(signal.source || signal.title || "Bitcoin philosophy sound money sovereignty");
          signal.url = `https://www.google.com/search?q=${searchTerm}`;
        }
      } else {
        qualityScore = 2;
      }
    }

    // Cache good content with rich metadata and title-based dedup (awaited to prevent data loss)
    if (signal.title && signal.body && signal.source && qualityScore > 0) {
      try {
        const { data: existing } = await svcClient.from("companion_cache").select("content").eq("companion_type", "signal").eq("language", "en").limit(30);
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
        const newNorm = norm(signal.title);
        const isDup = existing?.some((e: any) => {
          const t = norm(e.content?.title || "");
          return t === newNorm || t.includes(newNorm) || newNorm.includes(t);
        });
        if (!isDup) {
          let sourceHost = "";
          try { sourceHost = signal.url ? new URL(signal.url.startsWith("http") ? signal.url : `https://${signal.url}`).hostname.replace(/^www\./, "") : ""; } catch {}
          const fingerprint = btoa(newNorm).slice(0, 32);
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
            expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
            last_validated_at: qualityScore >= 2 ? new Date().toISOString() : null,
            automated_score: qualityScore,
          });
          if (cacheErr) log(`cache insert error: ${cacheErr.message}`);
        } else { log("cache dedup: skipped duplicate title"); }
      } catch (e) { log(`cache write failed: ${e}`); }
    }

    trackObs("companion_live_generated");
    log(`done, signal: ${signal.title}, source: ${signal.source}`);
    return jsonResponse({ ...signal, _serve_source: "live" });
  } catch (e) {
    console.error("signal-companion error:", e);
    try {
      return jsonResponse(pickRandom(SIGNAL_FALLBACKS));
    } catch {
      return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }
});
