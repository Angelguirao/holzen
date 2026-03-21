import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { verifyFlexAuth, createServiceClient } from "../_shared/auth.ts";
import { qualityGate, BANNED_PHRASES, containsSlop, contentFingerprint } from "../_shared/quality.ts";
import { createAttemptLogger, createObsTracker, createLogger } from "../_shared/observe.ts";
import { ZOOM_OUT_FALLBACKS, pickRandom } from "../_shared/fallbacks.ts";
import { COMPANION_ZOOM_OUT_DEEP_TIME } from "../_shared/cache.ts";

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const t0 = Date.now();
  const log = createLogger("zoom-out");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing authorization", 401);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid or empty request body", 400);
    }
    const { context, reflectionMessage, userId: bodyUserId, mood, recentTitles } = body;

    const { userId: resolvedUserId, isService } = await verifyFlexAuth(req, bodyUserId);
    if (!isService && !resolvedUserId) {
      return errorResponse("Not authenticated", 401);
    }
    const effectiveUserId = resolvedUserId || bodyUserId;

    const serviceClient = await createServiceClient();

    if (effectiveUserId) {
      try {
        await serviceClient.from("analytics_events").insert({ user_id: effectiveUserId, event: "zoom_out_ai_call" });
      } catch (_) { /* non-fatal */ }
    }

    const trackObs = effectiveUserId
      ? createObsTracker(serviceClient, effectiveUserId, "zoom_out", t0)
      : (_event: string, _meta?: Record<string, any>) => {};

    const logAttempt = createAttemptLogger(serviceClient, { userId: effectiveUserId || undefined });

    // ── 1. Fetch historical BTC prices with DB caching ──
    const today = new Date();
    const currentYear = today.getUTCFullYear();
    const month = today.getUTCMonth();
    const day = today.getUTCDate();

    const yearTargets = [1, 2, 3, 4].map(y => {
      const d = new Date(Date.UTC(currentYear - y, month, day));
      return { yearsAgo: y, dateKey: d.toISOString().slice(0, 10), ts: Math.floor(d.getTime() / 1000) };
    });

    const dateKeys = yearTargets.map(t => t.dateKey);
    const { data: cached } = await serviceClient.from("btc_price_cache").select("date, price").in("date", dateKeys);
    const cachedMap = new Map((cached || []).map((r: any) => [r.date, r.price]));
    const missingTargets = yearTargets.filter(t => !cachedMap.has(t.dateKey));

    let rateLimited = false;
    log(`cache hit: ${cachedMap.size}/${yearTargets.length}, fetching ${missingTargets.length}`);

    const newPrices: { date: string; price: number }[] = [];
    if (missingTargets.length > 0) {
      const timestamps = missingTargets.map(t => t.ts);
      const from = Math.min(...timestamps) - 86400;
      const to = Math.max(...timestamps) + 86400;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.status === 429) { await res.text(); rateLimited = true; }
        else if (res.ok) {
          const json = await res.json();
          const prices: [number, number][] = json?.prices || [];
          for (const target of missingTargets) {
            const targetMs = target.ts * 1000;
            let closest: [number, number] | null = null;
            let closestDist = Infinity;
            for (const [ts, price] of prices) {
              const dist = Math.abs(ts - targetMs);
              if (dist < closestDist) { closestDist = dist; closest = [ts, price]; }
            }
            if (closest && closestDist < 48 * 3600 * 1000) {
              newPrices.push({ date: target.dateKey, price: Math.round(closest[1]) });
            }
          }
        } else { await res.text(); }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") log("CoinGecko timeout");
      }
    }

    if (newPrices.length > 0) {
      const { error: priceErr } = await serviceClient.from("btc_price_cache").upsert(newPrices.map(p => ({ date: p.date, price: p.price, fetched_at: new Date().toISOString() })));
      if (priceErr) log(`btc_price_cache upsert error: ${priceErr.message}`);
    }

    const onThisDay: { yearsAgo: number; price: number; date: string }[] = [];
    for (const target of yearTargets) {
      const price = cachedMap.get(target.dateKey) ?? newPrices.find(p => p.date === target.dateKey)?.price;
      if (price) onThisDay.push({ yearsAgo: target.yearsAgo, date: target.dateKey, price: Math.round(price) });
    }

    // Current price
    let currentPrice: number | null = null;
    if (!rateLimited) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) { const json = await res.json(); currentPrice = json?.bitcoin?.usd ? Math.round(json.bitcoin.usd) : null; }
        else { if (res.status === 429) rateLimited = true; await res.text(); }
      } catch { /* ignore */ }
    }
    if (!currentPrice && context) {
      const priceMatch = context.match(/\$[\d,]+/);
      if (priceMatch) { const parsed = parseInt(priceMatch[0].replace(/[$,]/g, ''), 10); if (parsed > 0) currentPrice = parsed; }
    }

    // ── 2. Fetch past echo reflection ──
    let echoReflection: any = null;
    if (effectiveUserId) {
      try {
        const direction = context?.toLowerCase().includes("is down") ? "down" : context?.toLowerCase().includes("is up") ? "up" : null;
        if (direction) {
          const { data } = await serviceClient.from("reflections").select("message, created_at, mood, outcome, context").eq("user_id", effectiveUserId).not("outcome", "is", null).lt("created_at", new Date(Date.now() - 14 * 86400000).toISOString()).order("created_at", { ascending: false }).limit(50);
          if (data && data.length > 0) {
            const matching = data.filter((r: any) => direction === "down" ? r.context?.toLowerCase().includes("is down") : r.context?.toLowerCase().includes("is up"));
            const pool = matching.length > 0 ? matching : data;
            echoReflection = pool[Math.floor(Math.random() * Math.min(pool.length, 10))];
          }
        } else {
          const { data } = await serviceClient.from("reflections").select("message, created_at, mood, outcome").eq("user_id", effectiveUserId).not("outcome", "is", null).lt("created_at", new Date(Date.now() - 14 * 86400000).toISOString()).order("created_at", { ascending: false }).limit(10);
          if (data && data.length > 0) echoReflection = data[0];
        }
      } catch (e) { log(`echo fetch failed: ${e}`); }
    }

    // ── 3. Generate deep-time perspective via AI ──
    let deepTime: { title: string; body: string } | null = null;
    let deepTimeSource = "none"; // Track source for observability
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (LOVABLE_API_KEY) {
      const priceContext = currentPrice ? `Current BTC price: $${currentPrice.toLocaleString()}.` : "";
      const historyContext = onThisDay.length > 0
        ? `BTC prices on this day: ${onThisDay.map(e => `${e.yearsAgo}y ago: $${e.price.toLocaleString()}`).join(", ")}.`
        : "";

      const titleExclusion = (recentTitles && Array.isArray(recentTitles) && recentTitles.length > 0)
        ? `\nDo NOT reuse these titles or topics (already shown): ${recentTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT perspective.`
        : "";

      const systemPrompt = `You generate ONE deep-time perspective for a Bitcoin mindfulness app. Zoom WAY out — beyond markets, beyond decades — into civilizational, planetary, or epochal timescales.

Think like the Long Now Foundation. Think in centuries and millennia. Context:
- Human civilization's 5,000-year relationship with money
- Technology adoption curves (printing press: 50 years; internet: 30 years)
- Planetary scale (Earth: 4.5B years; modern humans: 300,000 years; agriculture: 10,000 years)
- Bitcoin: 15 years old in a 5,000-year history of money

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
                  deepTimeSource = "live";
                  logAttempt({ companion_type: "zoom_out", provider: "lovable", model, status: "success", latency_ms: Date.now() - attemptT0, input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
                  // Cache with rich metadata and title-based dedup (awaited to prevent data loss)
                  try {
                    const { data: existing } = await serviceClient.from("companion_cache").select("content").eq("companion_type", COMPANION_ZOOM_OUT_DEEP_TIME).eq("language", "en").limit(30);
                    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
                    const newNorm = norm(parsed.title);
                    const isDup = existing?.some((e: any) => { const t = norm(e.content?.title || ""); return t === newNorm || t.includes(newNorm) || newNorm.includes(t); });
                    if (!isDup) {
                      const fingerprint = await contentFingerprint(newNorm);
                      const { error: cacheErr } = await serviceClient.from("companion_cache").insert({
                        companion_type: COMPANION_ZOOM_OUT_DEEP_TIME,
                        language: "en",
                        content: deepTime,
                        quality_score: 2,
                        title: parsed.title,
                        title_norm: newNorm,
                        fingerprint,
                        source_kind: "deep_time",
                        expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
                        automated_score: 2,
                      });
                      if (cacheErr) log(`cache insert error: ${cacheErr.message}`);
                    }
                  } catch (e) { log(`cache write failed: ${e}`); }
                  break;
                } else if (parsed.title && parsed.body) {
                  log(`deepTime quality gate failed: body=${(parsed.body || "").length}chars slop=${containsSlop(parsed.body || "")}`);
                  logAttempt({ companion_type: "zoom_out", provider: "lovable", model, status: "quality_gate_failed", latency_ms: Date.now() - attemptT0, quality_gate_reason: "deep_time_quality", input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens });
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

      // Fallback chain: cache → curated
      if (!deepTime) {
        try {
          const { data: cachedDt } = await serviceClient.from("companion_cache").select("content, used_count, id").eq("companion_type", COMPANION_ZOOM_OUT_DEEP_TIME).eq("language", "en").order("used_count", { ascending: true }).limit(5);
          if (cachedDt && cachedDt.length > 0) {
            const pick = cachedDt[Math.floor(Math.random() * cachedDt.length)];
            deepTime = pick.content as any;
            deepTimeSource = "cache";
            serviceClient.from("companion_cache").update({ used_count: (pick.used_count || 0) + 1 }).eq("id", pick.id).then(() => {});
          }
        } catch { /* continue */ }

        if (!deepTime) {
          deepTime = pickRandom(ZOOM_OUT_FALLBACKS);
          deepTimeSource = "curated";
        }
      }
    } else {
      deepTime = pickRandom(ZOOM_OUT_FALLBACKS);
      deepTimeSource = "curated";
    }

    // Track deep-time observability
    if (deepTimeSource === "live") trackObs("companion_live_generated");
    else if (deepTimeSource === "cache") trackObs("companion_cache_hit");
    else if (deepTimeSource === "curated") trackObs("companion_fallback_curated");

    // ── 4. Build response ──
    const isPartial = rateLimited || onThisDay.length < yearTargets.length;
    const result = {
      onThisDay,
      currentPrice,
      echo: echoReflection ? { message: echoReflection.message, created_at: echoReflection.created_at, mood: echoReflection.mood, outcome: echoReflection.outcome } : null,
      deepTime,
      partial: isPartial,
    };

    log("done");
    return jsonResponse(result);
  } catch (e) {
    console.error("zoom-out error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
  }
});
