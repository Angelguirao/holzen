import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Pre-generates companion content overnight and populates the companion_cache.
 * Called via cron job. Generates a few pieces for each companion type across languages.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const svcClient = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing API keys" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lang = "en";
    const results: string[] = [];

    // Check current cache size to avoid over-generating
    const { count } = await svcClient
      .from("companion_cache")
      .select("id", { count: "exact", head: true });

    if ((count ?? 0) > 100) {
      // Prune old low-quality entries
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await svcClient
        .from("companion_cache")
        .delete()
        .lt("quality_score", 2)
        .lt("created_at", oneWeekAgo);
      results.push("Pruned old low-quality entries");
    }

    // Generate 2 ground nudges
    const BIAS_TOPICS = [
      "loss aversion and panic selling during market drops",
      "FOMO and herding behavior during market rallies",
      "disposition effect — selling winners too early",
      "anchoring bias in investment decisions",
      "emotional regulation during financial stress",
      "recency bias in market predictions",
      "overconfidence bias in trading decisions",
      "social proof and information cascading in crypto",
    ];

    for (const lang of languages) {
      const topic = BIAS_TOPICS[Math.floor(Math.random() * BIAS_TOPICS.length)];
      try {
        const searchRes = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: [
              { role: "system", content: "Find a specific academic study about " + topic + ". Include researcher names, year, journal, and quantitative findings." },
              { role: "user", content: `Find one specific behavioral finance research paper about ${topic} relevant to Bitcoin/crypto holders.` },
            ],
            search_mode: "academic",
          }),
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const searchContent = searchData.choices?.[0]?.message?.content || "";
          const citations: string[] = searchData.citations || [];

          if (searchContent) {
            const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: "Extract ONE grounding nudge from the search results. Tone: calm, grounding, no advice." },
                  { role: "user", content: `Search results:\n${searchContent}\n\nCitations:\n${citations.map((c, i) => `[${i + 1}] ${c}`).join("\n")}` },
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
              const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
              const content = toolCall?.function?.arguments || aiData.choices?.[0]?.message?.content;
              if (content) {
                const nudge = typeof content === "string" ? JSON.parse(content) : content;
                // Validate URL
                let qualityScore = 1;
                if (nudge.url && citations.includes(nudge.url)) {
                  try {
                    const headRes = await fetch(nudge.url, { method: "HEAD", redirect: "follow" });
                    if (headRes.status >= 200 && headRes.status < 400) qualityScore = 2;
                  } catch { /* */ }
                }

                await svcClient.from("companion_cache").insert({
                  companion_type: "ground_nudge",
                  language: lang,
                  content: nudge,
                  quality_score: qualityScore,
                });
                results.push(`ground_nudge/${lang}: ${nudge.title}`);
              }
            }
          }
        }
      } catch (e) {
        results.push(`ground_nudge/${lang} error: ${e}`);
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 3000));

      // Generate 1 signal
      try {
        const signalSearchRes = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: [
              { role: "system", content: "Find one specific, data-driven Bitcoin insight about on-chain metrics, macro trends, or long-term holder behavior. Include exact numbers and source names." },
              { role: "user", content: "Latest Bitcoin on-chain analysis or macro trend with specific data points from a named researcher or analyst." },
            ],
            search_recency_filter: "month",
          }),
        });

        if (signalSearchRes.ok) {
          const signalData = await signalSearchRes.json();
          const searchContent = signalData.choices?.[0]?.message?.content || "";
          const citations: string[] = signalData.citations || [];

          if (searchContent) {
            const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: "Extract ONE holder-focused market signal from the search results." },
                  { role: "user", content: `Search results:\n${searchContent}\n\nCitations:\n${citations.map((c, i) => `[${i + 1}] ${c}`).join("\n")}` },
                ],
                tools: [{
                  type: "function",
                  function: {
                    name: "return_signal",
                    description: "Return a market signal",
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
                temperature: 0.3,
              }),
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
              const content = toolCall?.function?.arguments || aiData.choices?.[0]?.message?.content;
              if (content) {
                const signal = typeof content === "string" ? JSON.parse(content) : content;
                let qualityScore = 1;
                if (signal.url && citations.includes(signal.url)) {
                  try {
                    const headRes = await fetch(signal.url, { method: "HEAD", redirect: "follow" });
                    if (headRes.status >= 200 && headRes.status < 400) qualityScore = 2;
                  } catch { /* */ }
                }

                await svcClient.from("companion_cache").insert({
                  companion_type: "signal",
                  language: lang,
                  content: signal,
                  quality_score: qualityScore,
                });
                results.push(`signal/${lang}: ${signal.title}`);
              }
            }
          }
        }
      } catch (e) {
        results.push(`signal/${lang} error: ${e}`);
      }
    }

    // Also process feedback: upgrade/downgrade quality based on analytics
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

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pregenerate-companions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
