import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createAttemptLogger } from "../_shared/observe.ts";
import { callPerplexityChat } from "../_shared/perplexity-client.ts";
import { holzenEdgeError, holzenEdgeLog, holzenEdgeRun } from "../_shared/holzen-edge-log.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import {
  canonicalContentUrl,
  contentSnippetFingerprint,
  isCompanionCacheDuplicate,
  normalizeTitleKey,
} from "../_shared/content-dedup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── URL validation ──
async function isUrlReachable(url: string): Promise<boolean> {
  if (!url || url.length < 10) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    clearTimeout(timeout);
    return res.status >= 200 && res.status < 400;
  } catch { return false; }
}

serve(
  withRequestLogging("pregenerate-companions", async ({ req }) => {
  const t0 = Date.now();
  const hzLog = (msg: string) => holzenEdgeLog("pregenerate", msg, { ms: Date.now() - t0 });

  try {
    holzenEdgeRun("pregenerate", "request", { method: req.method });
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      holzenEdgeRun("pregenerate", "auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized. Requires service role or CRON_SECRET." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    holzenEdgeRun("pregenerate", "auth ok");

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.57.2");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const svcClient = createClient(sbUrl, serviceRoleKey, { auth: { persistSession: false } });
    const logAttempt = createAttemptLogger(svcClient);

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing API keys" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Feature flag + panic mode guard. The cache-warmer is the single
    // biggest blast-radius cron if a bug loops, so this check is especially
    // important. Also respects panic_mode (which includes `pregenerate`).
    const { guardAiFeature } = await import("../_shared/ratelimit.ts");
    const pregenGuard = await guardAiFeature(svcClient, "pregenerate", {
      providers: ["perplexity", "lovable"],
    });
    if (!pregenGuard.allowed) {
      hzLog(`pregenerate skipped: ${pregenGuard.reason}`);
      return new Response(
        JSON.stringify({ skipped: true, reason: pregenGuard.reason }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: string[] = [];

    // ═══════════════════════════════════════════
    // STEP 1: Smart Cache Lifecycle
    // ═══════════════════════════════════════════
    // Instead of blindly deleting old entries, we:
    // 1. PROMOTE high-quality entries to permanent (no expiry) — these become curated
    // 2. PRUNE low-quality entries after 3 days
    // 3. EXPIRE medium entries after 30 days (extended from 14)

    // 1a. Promote: quality_score >= 3 → set expires_at = null (permanent/curated)
    const { data: promoted } = await svcClient
      .from("companion_cache")
      .update({ expires_at: null })
      .gte("quality_score", 3)
      .not("expires_at", "is", null)
      .select("id");
    if (promoted && promoted.length > 0) results.push(`Promoted ${promoted.length} high-quality entries to permanent`);

    // 1b. Auto-promote: quality_score >= 2 AND used_count >= 3 (served 3+ times successfully)
    const { data: autoPromoted } = await svcClient
      .from("companion_cache")
      .update({ expires_at: null, quality_score: 3 })
      .gte("quality_score", 2)
      .gte("used_count", 3)
      .not("expires_at", "is", null)
      .select("id");
    if (autoPromoted && autoPromoted.length > 0) results.push(`Auto-promoted ${autoPromoted.length} proven entries to permanent`);

    // 2. Prune: low-quality (score < 2) older than 3 days → delete
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: pruned } = await svcClient
      .from("companion_cache")
      .delete()
      .lt("quality_score", 2)
      .lt("created_at", threeDaysAgo)
      .select("id");
    if (pruned && pruned.length > 0) results.push(`Pruned ${pruned.length} low-quality entries`);

    // 3. Expire: medium entries (score 1-2, not permanent) older than 30 days → delete
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expired } = await svcClient
      .from("companion_cache")
      .delete()
      .lt("quality_score", 3)
      .lt("created_at", thirtyDaysAgo)
      .not("expires_at", "is", null)  // don't touch permanent entries
      .select("id");
    if (expired && expired.length > 0) results.push(`Expired ${expired.length} stale medium-quality entries`);

    hzLog("Cache lifecycle done");

    // ═══════════════════════════════════════════
    // STEP 2: Generate Grounding (2 entries)
    // ═══════════════════════════════════════════
    const BIAS_TOPICS = [
      "loss aversion and panic selling during market drops",
      "FOMO and herding behavior during market rallies",
      "disposition effect — selling winners too early",
      "anchoring bias in investment decisions",
      "emotional regulation during financial stress",
      "recency bias in market predictions",
      "overconfidence bias in trading decisions",
      "social proof and information cascading in crypto",
      "endowment effect in portfolio management",
      "sunk cost fallacy in declining markets",
    ];

    for (let i = 0; i < 2; i++) {
      const topic = BIAS_TOPICS[Math.floor(Math.random() * BIAS_TOPICS.length)];
      try {
        const pT0 = Date.now();
        const searchPayload = await callPerplexityChat({
          model: "sonar-pro",
          messages: [
            { role: "system", content: "Find a specific academic study about " + topic + ". Include researcher names, year, journal, and quantitative findings." },
            { role: "user", content: `Find one specific behavioral finance research paper about ${topic} relevant to Bitcoin/crypto holders.` },
          ],
          search_mode: "academic",
        }, PERPLEXITY_API_KEY, hzLog, 45_000);
        logAttempt({
          companion_type: "pregenerate",
          provider: "perplexity",
          model: "sonar-pro",
          status: "success",
          latency_ms: Date.now() - pT0,
          input_tokens: searchPayload.usage?.prompt_tokens,
          output_tokens: searchPayload.usage?.completion_tokens,
          api_requests: 1,
        });
        const searchContent = searchPayload.content;
        const citations: string[] = searchPayload.citations || [];

        if (searchContent) {
          const aiT0 = Date.now();
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: "Extract ONE grounding nudge from the search results. Tone: calm, grounding, no advice. Title: evocative, 5-10 words. Body: 2-3 sentences with specific findings." },
                  { role: "user", content: `Search results:\n${searchContent}\n\nCitations:\n${citations.map((c: string, j: number) => `[${j + 1}] ${c}`).join("\n")}` },
                ],
                tools: [{
                  type: "function",
                  function: {
                    name: "return_grounding_nudge",
                    description: "Return a grounding nudge",
                    parameters: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        body: { type: "string" },
                        citation: { type: "string" },
                        url: { type: "string" },
                      },
                      required: ["title", "body", "citation", "url"],
                      additionalProperties: false,
                    },
                  },
                }],
                tool_choice: { type: "function", function: { name: "return_grounding_nudge" } },
                temperature: 0.3,
              }),
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              const gUsage = aiData.usage;
              logAttempt({
                companion_type: "pregenerate",
                provider: "lovable",
                model: "google/gemini-2.5-flash",
                status: "success",
                latency_ms: Date.now() - aiT0,
                input_tokens: gUsage?.prompt_tokens,
                output_tokens: gUsage?.completion_tokens,
              });
              const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
              const content = toolCall?.function?.arguments || aiData.choices?.[0]?.message?.content;
              if (content) {
                const nudge = typeof content === "string" ? JSON.parse(content) : content;

                // Dedup check
                if (await isCompanionCacheDuplicate(svcClient, "ground_nudge", nudge.title, {
                  url: nudge.url,
                  bodySnippet: nudge.body,
                })) {
                  results.push(`ground_nudge: SKIPPED duplicate "${nudge.title}"`);
                } else {
                  let qualityScore = 1;
                  if (nudge.url) {
                    if (await isUrlReachable(nudge.url)) qualityScore = 2;
                  }
                  const nudgeFp = await contentSnippetFingerprint(nudge.body || "");
                  await svcClient.from("companion_cache").insert({
                    companion_type: "ground_nudge",
                    language: "en",
                    content: nudge,
                    quality_score: qualityScore,
                    title: nudge.title,
                    title_norm: normalizeTitleKey(nudge.title),
                    source_url: nudge.url ? (canonicalContentUrl(nudge.url) ?? nudge.url) : null,
                    fingerprint: nudgeFp,
                  });
                  results.push(`ground_nudge: ${nudge.title} (q=${qualityScore})`);
                }
              }
            }
          }
      } catch (e) {
        results.push(`ground_nudge error: ${e}`);
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    // ═══════════════════════════════════════════
    // STEP 3: Generate Philosophy/Signal (1 entry)
    // ═══════════════════════════════════════════
    const SIGNAL_TOPICS = [
      "Bitcoin as sound money and its philosophical implications for human freedom",
      "Time preference and proof of work as a life philosophy",
      "Self-sovereignty and the meaning of financial independence through Bitcoin",
      "The philosophical case for patience and conviction in Bitcoin holding",
      "Bitcoin and Austrian economics: what sound money teaches about civilization",
      "Proof of work as sacrifice: the deeper meaning behind Bitcoin mining",
      "Bitcoin as a tool for individual sovereignty against institutional trust",
      "The separation of money and state as a civilizational shift",
    ];
    const signalTopic = SIGNAL_TOPICS[Math.floor(Math.random() * SIGNAL_TOPICS.length)];

    try {
      const sigT0 = Date.now();
      const signalPayload = await callPerplexityChat({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "Find a profound philosophical essay, talk, or piece of writing about Bitcoin. Focus on ideas, not market data. Look for thinkers like Allen Farrington, Vijay Boyapati, Parker Lewis, Gigi, Robert Breedlove, Saifedean Ammous, Jeff Booth, Lyn Alden, or similar." },
          { role: "user", content: `Find a specific philosophical Bitcoin essay or insight about: ${signalTopic}. Include the author/thinker name and a link to the original piece.` },
        ],
        search_recency_filter: "year",
      }, PERPLEXITY_API_KEY, hzLog, 45_000);
      logAttempt({
        companion_type: "pregenerate",
        provider: "perplexity",
        model: "sonar-pro",
        status: "success",
        latency_ms: Date.now() - sigT0,
        input_tokens: signalPayload.usage?.prompt_tokens,
        output_tokens: signalPayload.usage?.completion_tokens,
        api_requests: 1,
      });
      const searchContent = signalPayload.content;
      const citations: string[] = signalPayload.citations || [];

      if (searchContent) {
        const sigAiT0 = Date.now();
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "Extract ONE philosophical Bitcoin insight. Tone: profound, calm, grounding. Not data-driven — idea-driven. Title: evocative, 5-10 words. Body: 2-3 sentences. No numbers, percentages, or price mentions." },
                { role: "user", content: `Search results:\n${searchContent}\n\nCitations:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}` },
              ],
              tools: [{
                type: "function",
                function: {
                  name: "return_signal",
                  description: "Return a philosophical Bitcoin insight",
                  parameters: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      body: { type: "string" },
                      source: { type: "string" },
                      url: { type: "string" },
                    },
                    required: ["title", "body", "source", "url"],
                    additionalProperties: false,
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "return_signal" } },
              temperature: 0.5,
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const sigUsage = aiData.usage;
            logAttempt({
              companion_type: "pregenerate",
              provider: "lovable",
              model: "google/gemini-2.5-flash",
              status: "success",
              latency_ms: Date.now() - sigAiT0,
              input_tokens: sigUsage?.prompt_tokens,
              output_tokens: sigUsage?.completion_tokens,
            });
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            const content = toolCall?.function?.arguments || aiData.choices?.[0]?.message?.content;
            if (content) {
              const signal = typeof content === "string" ? JSON.parse(content) : content;

              if (await isCompanionCacheDuplicate(svcClient, "signal", signal.title, {
                url: signal.url,
                bodySnippet: signal.body,
              })) {
                results.push(`signal: SKIPPED duplicate "${signal.title}"`);
              } else {
                let qualityScore = 1;
                if (signal.url && await isUrlReachable(signal.url)) qualityScore = 2;
                const signalFp = await contentSnippetFingerprint(signal.body || "");
                await svcClient.from("companion_cache").insert({
                  companion_type: "signal",
                  language: "en",
                  content: signal,
                  quality_score: qualityScore,
                  title: signal.title,
                  title_norm: normalizeTitleKey(signal.title),
                  source_url: signal.url ? (canonicalContentUrl(signal.url) ?? signal.url) : null,
                  fingerprint: signalFp,
                });
                results.push(`signal: ${signal.title} (q=${qualityScore})`);
              }
            }
          }
        }
    } catch (e) {
      results.push(`signal error: ${e}`);
    }

    await new Promise(r => setTimeout(r, 2000));

    // ═══════════════════════════════════════════
    // STEP 4: Generate History (1 entry) — NEW
    // ═══════════════════════════════════════════
    const HISTORICAL_ERAS = [
      "1637 Dutch Tulip Mania and speculative bubbles",
      "1929 Wall Street Crash and its aftermath",
      "1970s gold price volatility after Nixon shock",
      "1987 Black Monday stock market crash",
      "1997 Asian financial crisis and currency collapses",
      "2000 dot-com bubble burst and tech stock crash",
      "2008 global financial crisis and bank failures",
      "2013 gold price crash of 26% in three days",
      "2015 Swiss franc shock and currency market chaos",
      "2020 COVID crash and rapid market recovery",
    ];
    const historyEra = HISTORICAL_ERAS[Math.floor(Math.random() * HISTORICAL_ERAS.length)];

    try {
      const histT0 = Date.now();
      const histPayload = await callPerplexityChat({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "Find a detailed historical account of this financial event. Include specific dates, percentage changes, key figures involved, and the long-term outcome. Focus on the emotional experience of investors during the crisis." },
          { role: "user", content: `Tell me about ${historyEra} — what happened, how investors felt, and what the outcome was years later.` },
        ],
      }, PERPLEXITY_API_KEY, hzLog, 45_000);
      logAttempt({
        companion_type: "pregenerate",
        provider: "perplexity",
        model: "sonar-pro",
        status: "success",
        latency_ms: Date.now() - histT0,
        input_tokens: histPayload.usage?.prompt_tokens,
        output_tokens: histPayload.usage?.completion_tokens,
        api_requests: 1,
      });
      const searchContent = histPayload.content;
      const citations: string[] = histPayload.citations || [];

      if (searchContent) {
        const histAiT0 = Date.now();
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: `You are a financial historian. Extract ONE historical parallel from the search results. The title should be evocative (e.g., "When gold crashed 26% in 2013"). btcInsight: 2-3 sentences about what happened with specific dates and numbers. analogy: 1-2 sentences connecting it to Bitcoin holding. Include assetClass, period, source name.` },
                { role: "user", content: `Search results:\n${searchContent}\n\nCitations:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}` },
              ],
              response_format: { type: "json_object" },
              temperature: 0.4,
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const histUsage = aiData.usage;
            logAttempt({
              companion_type: "pregenerate",
              provider: "lovable",
              model: "google/gemini-2.5-flash",
              status: "success",
              latency_ms: Date.now() - histAiT0,
              input_tokens: histUsage?.prompt_tokens,
              output_tokens: histUsage?.completion_tokens,
            });
            const raw = aiData.choices?.[0]?.message?.content;
            if (raw) {
              const insight = JSON.parse(raw);
              if (insight.title && insight.btcInsight) {
                // Pin URL to first citation if available
                if (!insight.url && citations.length > 0) insight.url = citations[0];

                if (await isCompanionCacheDuplicate(svcClient, "historical_insight", insight.title, {
                  url: insight.url,
                  bodySnippet: insight.btcInsight,
                })) {
                  results.push(`history: SKIPPED duplicate "${insight.title}"`);
                } else {
                  let qualityScore = 1;
                  if (insight.url && await isUrlReachable(insight.url)) qualityScore = 2;
                  const histFp = await contentSnippetFingerprint(insight.btcInsight || "");
                  await svcClient.from("companion_cache").insert({
                    companion_type: "historical_insight",
                    language: "en",
                    content: insight,
                    quality_score: qualityScore,
                    title: insight.title,
                    title_norm: normalizeTitleKey(insight.title),
                    source_url: insight.url ? (canonicalContentUrl(insight.url) ?? insight.url) : null,
                    fingerprint: histFp,
                  });
                  results.push(`history: ${insight.title} (q=${qualityScore})`);
                }
              }
            }
          }
        }
    } catch (e) {
      results.push(`history error: ${e}`);
    }

    await new Promise(r => setTimeout(r, 2000));

    // ═══════════════════════════════════════════
    // STEP 5: Generate Zoom Out deep-time (1 entry) — NEW
    // ═══════════════════════════════════════════
    const ZOOM_OUT_THEMES = [
      "Compare Bitcoin's 15-year existence to the 5,000-year history of money",
      "Place today's market volatility against the geological timescale of Earth",
      "Compare Bitcoin adoption speed to the spread of the printing press, electricity, and internet",
      "Bitcoin's energy use in context of the sun's output and civilizational energy growth",
      "The patience of cathedral builders: multi-generational projects and monetary systems",
      "The Long Now Foundation perspective: thinking in 10,000-year timescales about money",
      "Compare Bitcoin's price history to gold's millennia-long journey to monetary status",
      "Civilizational time preference: what societies that save in hard money build vs. those that don't",
    ];
    const zoomTheme = ZOOM_OUT_THEMES[Math.floor(Math.random() * ZOOM_OUT_THEMES.length)];

    try {
      const zoomT0 = Date.now();
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: `You provide deep-time civilizational perspective on Bitcoin. Frame everything against thousands or millions of years. Tone: calm, vast, philosophical. No market data, no price predictions, no trading advice. Return JSON with "title" (evocative, 5-8 words) and "body" (2-3 sentences).` },
            { role: "user", content: zoomTheme },
          ],
          response_format: { type: "json_object" },
          temperature: 0.6,
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const zoomUsage = aiData.usage;
        logAttempt({
          companion_type: "pregenerate",
          provider: "lovable",
          model: "google/gemini-2.5-flash",
          status: "success",
          latency_ms: Date.now() - zoomT0,
          input_tokens: zoomUsage?.prompt_tokens,
          output_tokens: zoomUsage?.completion_tokens,
        });
        const raw = aiData.choices?.[0]?.message?.content;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.title && parsed.body) {
            if (await isCompanionCacheDuplicate(svcClient, "zoom_out_deep_time", parsed.title, {
              bodySnippet: parsed.body,
            })) {
              results.push(`zoom_out: SKIPPED duplicate "${parsed.title}"`);
            } else {
              const zoomFp = await contentSnippetFingerprint(parsed.body || "");
              await svcClient.from("companion_cache").insert({
                companion_type: "zoom_out_deep_time",
                language: "en",
                content: { title: parsed.title, body: parsed.body },
                quality_score: 2,
                title: parsed.title,
                title_norm: normalizeTitleKey(parsed.title),
                fingerprint: zoomFp,
              });
              results.push(`zoom_out: ${parsed.title}`);
            }
          }
        }
      }
    } catch (e) {
      results.push(`zoom_out error: ${e}`);
    }

    // ═══════════════════════════════════════════
    // STEP 6: Process feedback (same as before)
    // ═══════════════════════════════════════════
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: feedback } = await svcClient
        .from("analytics_events")
        .select("metadata")
        .eq("event", "companion_feedback")
        .gte("created_at", oneDayAgo);

      if (feedback && feedback.length > 0) {
        const scoreChanges = new Map<string, number>();
        for (const f of feedback) {
          const meta = f.metadata as any;
          if (meta?.cache_id) {
            const current = scoreChanges.get(meta.cache_id) || 0;
            scoreChanges.set(meta.cache_id, current + (meta.vote === "up" ? 1 : -1));
          }
        }

        for (const [cacheId, delta] of scoreChanges) {
          const { data: entry } = await svcClient
            .from("companion_cache")
            .select("quality_score")
            .eq("id", cacheId)
            .single();
          if (entry) {
            const newScore = Math.max(0, Math.min(3, (entry.quality_score || 1) + delta));
            await svcClient
              .from("companion_cache")
              .update({ quality_score: newScore })
              .eq("id", cacheId);
          }
        }
        results.push(`Processed ${feedback.length} feedback entries`);
      }
    } catch (e) {
      results.push(`Feedback processing error: ${e}`);
    }

    holzenEdgeLog("pregenerate", "run complete", { ms: Date.now() - t0, resultLines: results.length });
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    holzenEdgeError("pregenerate", "uncaught error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  })
);
