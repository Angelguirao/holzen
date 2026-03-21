import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createServiceClient, verifyFlexAuth } from "../_shared/auth.ts";
import { qualityGate, BANNED_PHRASES, contentFingerprint } from "../_shared/quality.ts";
import { createAttemptLogger, createObsTracker, createLogger } from "../_shared/observe.ts";
import { HISTORY_FALLBACKS, pickRandom } from "../_shared/fallbacks.ts";
import { serveFromCache } from "../_shared/cache.ts";

/** Cache (ranked) → curated fallbacks. */
async function serveFallback(svcClient: any, excludeIds?: string[]): Promise<{ data: any; source: string; cacheId: string | null }> {
  const cached = await serveFromCache(svcClient, "historical_insight", "en", excludeIds);
  if (cached) return { data: cached.data, source: "cache", cacheId: cached.cacheId };
  return { data: pickRandom(HISTORY_FALLBACKS), source: "curated", cacheId: null };
}

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const t0 = Date.now();
  const log = createLogger("historical-insight");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Unauthorized", 401);
    }

    const { context, userId: bodyUserId, mood, recentTitles } = await req.json();

    const auth = await verifyFlexAuth(req, bodyUserId);
    if (!auth.isService && auth.userId === null) {
      return errorResponse("Unauthorized", 401);
    }

    const effectiveUserId = auth.userId || bodyUserId;

    const svcClient = await createServiceClient();

    if (effectiveUserId) {
      try { await svcClient.from("analytics_events").insert({ user_id: effectiveUserId, event: "historical_insight_ai_call" }); } catch (_) { /* non-fatal */ }
    }

    const trackObs = effectiveUserId
      ? createObsTracker(svcClient, effectiveUserId, "historical_insight", t0)
      : (_event: string, _meta?: Record<string, any>) => {};

    const logAttempt = createAttemptLogger(svcClient, { userId: effectiveUserId || undefined });

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
      log("missing API keys, serving fallback");
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated");
      return jsonResponse({ ...fb.data, _cache_id: fb.cacheId, _serve_source: fb.source });
    }

    const marketContext = context || "Bitcoin market movement";
    const moodContext = mood ? `The user is currently feeling "${mood}".` : "";
    const titleExclusion = (recentTitles && Array.isArray(recentTitles) && recentTitles.length > 0)
      ? `\nDo NOT cover these topics (already shown recently): ${recentTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT historical event.`
      : "";
    const HISTORICAL_ERAS = [
      { era: "early Bitcoin (2011-2013)", examples: "Bitcoin's first bubble to $32 then crash to $2, the 2013 China ban crash" },
      { era: "Mt. Gox era (2014-2015)", examples: "Mt. Gox collapse, the long crypto winter of 2014-2015" },
      { era: "ICO boom and bust (2017-2018)", examples: "Bitcoin's rise to $20k, the 2018 crash, ICO mania" },
      { era: "COVID and institutional era (2020-2021)", examples: "March 2020 crash, MicroStrategy buys, El Salvador adoption, $69k peak" },
      { era: "crypto winter (2022-2023)", examples: "Luna/Terra collapse, FTX fraud, contagion effects" },
      { era: "traditional finance parallels", examples: "1987 Black Monday, dot-com bubble 2000, 2008 financial crisis, gold's 1980 peak" },
      { era: "commodity and forex history", examples: "oil price shocks, Swiss franc unpegging, Asian financial crisis 1997" },
      { era: "tech stock parallels", examples: "Amazon's 95% crash, Apple near-bankruptcy, Cisco post-dot-com" },
    ];
    const randomEra = HISTORICAL_ERAS[Math.floor(Math.random() * HISTORICAL_ERAS.length)];

    // ── Step 1: Perplexity search ──
    log("calling perplexity");
    let searchContent = "";
    let citations: string[] = [];

    try {
      const searchController = new AbortController();
      const searchTimeout = setTimeout(() => searchController.abort(), 10000);
      const searchResponse = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content: `You are a financial historian specializing in ${randomEra.era}. Search for ONE specific historical event with exact dates, prices, and percentage moves. Do NOT give a general overview — find a specific incident. Include what happened afterward (recovery timeline). Draw from: ${randomEra.examples}. Be precise with numbers.${titleExclusion}`,
            },
            { role: "user", content: `Find a specific historical financial event from ${randomEra.era} that parallels current Bitcoin conditions: ${marketContext}. ${moodContext} Include exact dates, prices, percentage moves, and what happened after.` },
          ],
        }),
        signal: searchController.signal,
      });
      clearTimeout(searchTimeout);
      log(`perplexity responded ${searchResponse.status}`);

      if (!searchResponse.ok) {
        await searchResponse.text();
        throw new Error(`Perplexity ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      searchContent = searchData.choices?.[0]?.message?.content || "";
      citations = searchData.citations || [];
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
- "source": Source name
- "url": URL from citations

ACCURACY RULES (CRITICAL):
- Use ONLY dates, prices, percentages from the search results
- Do NOT invent historical prices or recovery timelines
- End with "this too passed" energy, not hype or doom

BANNED PHRASES — NEVER use any of these: ${BANNED_PHRASES.join(", ")}${mood ? `\n\nUSER MOOD: The user is feeling "${mood}". Subtly calibrate the historical parallel to resonate with this emotional state.` : ""}${titleExclusion}`,
        },
        {
          role: "user",
          content: `Market context: ${marketContext}\n\nSearch results:\n${searchContent}\n\nCitation URLs:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}`,
        },
      ],
    };

    const models = ["google/gemini-2.5-flash", "google/gemini-3-flash-preview"];
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
        if (model !== models[models.length - 1]) continue;
        break;
      }
    }

    const qg = qualityGate("historical_insight", insight);
    if (!insight || !qg.pass) {
      log(`quality gate failed: ${!insight ? "no insight" : (qg.reason ?? "unknown")}`);
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated", { reason: "quality_gate" });
      return jsonResponse({ ...fb.data, _cache_id: fb.cacheId, _serve_source: fb.source });
    }

    // Ensure URL is from citations
    if (citations.length > 0 && !citations.includes(insight.url)) {
      insight.url = citations[0];
    }

    // ── URL validation via HEAD request ──
    if (insight.url) {
      try {
        const urlController = new AbortController();
        const urlTimeout = setTimeout(() => urlController.abort(), 3000);
        const headRes = await fetch(insight.url, { method: "HEAD", redirect: "follow", signal: urlController.signal });
        clearTimeout(urlTimeout);
        if (headRes.status >= 400) {
          log(`URL ${insight.url} returned ${headRes.status}, clearing`);
          let validUrl = "";
          for (const c of citations) {
            if (c === insight.url) continue;
            try {
              const uc = new AbortController();
              const ut = setTimeout(() => uc.abort(), 2000);
              const r = await fetch(c, { method: "HEAD", redirect: "follow", signal: uc.signal });
              clearTimeout(ut);
              if (r.status < 400) { validUrl = c; break; }
            } catch { continue; }
          }
          insight.url = validUrl || insight.source || "";
        }
      } catch {
        log(`URL validation timed out for ${insight.url}`);
      }
    }

    // Cache good content with rich metadata and title-based dedup (awaited to prevent data loss)
    const urlReachable = insight.url && insight.url.startsWith("http");
    const histQuality = urlReachable ? 2 : 1;
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
          try { sourceHost = insight.url ? new URL(insight.url.startsWith("http") ? insight.url : `https://${insight.url}`).hostname.replace(/^www\./, "") : ""; } catch {}
          const fingerprint = await contentFingerprint(newNorm);
          const { error: cacheErr } = await svcClient.from("companion_cache").insert({
            companion_type: "historical_insight",
            language: "en",
            content: insight,
            quality_score: histQuality,
            title: insight.title,
            title_norm: newNorm,
            fingerprint,
            source_kind: "historical_event",
            source_title: insight.source || null,
            source_author: null,
            source_url: insight.url || null,
            source_host: sourceHost || null,
            citations: citations.length > 0 ? JSON.stringify(citations) : null,
            market_regime: insight.assetClass || null,
            expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
            last_validated_at: histQuality >= 2 ? new Date().toISOString() : null,
            automated_score: histQuality,
          });
          if (cacheErr) log(`cache insert error: ${cacheErr.message}`);
        }
      } catch (e) { log(`cache write failed: ${e}`); }
    }

    trackObs("companion_live_generated");
    log(`done: ${insight.title}`);
    return jsonResponse({ ...insight, _serve_source: "live" });
  } catch (e) {
    log.error("unhandled error", { error: e instanceof Error ? e.message : String(e) });
    try {
      return jsonResponse(pickRandom(HISTORY_FALLBACKS));
    } catch {
      return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }
});
