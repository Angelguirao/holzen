import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidUrl(s: string): boolean {
  if (!s || s === "N/A" || s.length < 10) return false;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeUrl(s: string): string {
  if (!s) return "";
  if (!s.startsWith("http")) return `https://${s}`;
  return s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();
  const log = (msg: string) => console.log(`[signal] ${msg} (+${Date.now() - t0}ms)`);

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid or empty request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { context, language, sources, recentSignalSources, recentSignalTitles } = body;
    log("parsed body");

    // Verify JWT and track AI usage
    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbClient = createClient(sbUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await sbClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    log("auth verified");

    // Track AI usage — fire-and-forget
    const userId = claimsData.claims.sub as string;
    (async () => {
      try {
        const svc = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
        await svc.from("analytics_events").insert({ user_id: userId, event: "signal_companion_ai_call" });
      } catch (_) { /* non-fatal */ }
    })();

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build source name list for context — used as diversity hints
    const sourceNames: string[] = [];
    if (sources && Array.isArray(sources) && sources.length > 0) {
      for (const s of sources) {
        if (s.name) sourceNames.push(s.name);
      }
    }

    // Build exclusion hint from recently used sources to enforce diversity
    const recentExclusion = (recentSignalSources && Array.isArray(recentSignalSources) && recentSignalSources.length > 0)
      ? ` Do NOT use insights from: ${recentSignalSources.slice(0, 5).join(", ")}. Pick a DIFFERENT source.`
      : "";

    // Build topic exclusion to avoid repeating the same headline/story
    const topicExclusion = (recentSignalTitles && Array.isArray(recentSignalTitles) && recentSignalTitles.length > 0)
      ? `\nDo NOT cover these topics (already shown to user): ${recentSignalTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT angle or metric.`
      : "";

    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langCode = language || "en";
    const langName = LANG_NAMES[langCode] || "English";

    // Step 1: Perplexity search — rotate source hints, exclude recent
    const sourceHint = sourceNames.length > 0
      ? ` Look for insights from sources like: ${sourceNames.sort(() => Math.random() - 0.5).slice(0, 5).join(", ")}.`
      : "";

    // Extract URLs from user sources for domain filtering
    const sourceUrls: string[] = [];
    if (sources && Array.isArray(sources)) {
      for (const s of sources) {
        if (s.url && typeof s.url === "string") {
          try {
            const hostname = new URL(s.url.startsWith("http") ? s.url : `https://${s.url}`).hostname.replace(/^www\./, "");
            if (hostname && !sourceUrls.includes(hostname)) sourceUrls.push(hostname);
          } catch { /* skip invalid */ }
        }
      }
    }

    const ANTI_TRADING_INSTRUCTION = `CRITICAL CONTENT RULES:
- Do NOT return content about short-term trading signals, chart patterns, technical analysis setups, entry/exit points, or price targets
- Do NOT cite trading educators, signal groups, or chart pattern analysts (e.g. "Chart Champions", trading Telegram groups)
- FOCUS ON: on-chain data, macro trends, adoption metrics, network health, long-term holder behavior, institutional flows, mining economics, supply dynamics
- Prefer sources like: on-chain analysts, macro researchers, Bitcoin-focused newsletters, network data dashboards`;

    const searchQuery = context
      ? `Current Bitcoin market: ${context}. Find one specific, data-driven insight about on-chain metrics, macro trends, adoption, or long-term holder behavior from a Bitcoin researcher or analyst.${sourceHint}${recentExclusion}`
      : `Latest Bitcoin on-chain analysis, macro trends, or long-term holder metrics with specific data points from researchers or analysts.${sourceHint}${recentExclusion}`;

    const perplexityBody: any = {
      model: "sonar",
      messages: [
        {
          role: "system",
          content: `You are a Bitcoin market research assistant focused on LONG-TERM holder perspective. Find one specific, data-driven insight with real numbers and dates.

${ANTI_TRADING_INSTRUCTION}

DIVERSITY RULES:
- Use a DIFFERENT source every time — rotate between on-chain analysts, macro blogs, newsletters, dashboards, and podcasts
- Do NOT default to Glassnode or any single source
- Prefer recent analysis (last 7 days) from named analysts or publications
- Include the exact source name and a working URL to the specific article/page${recentExclusion}${topicExclusion}`,
        },
        { role: "user", content: searchQuery },
      ],
      search_recency_filter: "week",
      ...(sourceUrls.length > 0 ? { search_domain_filter: sourceUrls.slice(0, 5) } : {}),
    };

    // Helper to call Perplexity with given body
    async function callPerplexity(pBody: any): Promise<{ content: string; citations: string[] }> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
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
        return {
          content: data.choices?.[0]?.message?.content || "",
          citations: data.citations || [],
        };
      } catch (e) {
        clearTimeout(timeout);
        throw e;
      }
    }

    log("calling perplexity");
    let searchContent = "";
    let citations: string[] = [];

    try {
      // First attempt: with domain filter if available
      const result = await callPerplexity(perplexityBody);
      searchContent = result.content;
      citations = result.citations;
      log(`perplexity content length: ${searchContent.length}, citations: ${citations.length}`);

      // If domain filter was used but got 0 citations, retry WITHOUT the filter
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
        } catch (retryErr) {
          log(`retry failed, using original content: ${retryErr}`);
          // Keep original searchContent, just no citations
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        log("perplexity timed out after 12s");
        return new Response(
          JSON.stringify({ error: "Search timed out" }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (e instanceof Error && e.message === "RATE_LIMITED") {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw e;
    }

    if (!searchContent) {
      throw new Error("No search content returned");
    }

    // Step 2: Use Lovable AI to structure the result
    const langInstruction = langCode !== "en" ? `Write title and body in ${langName}. Keep source name/URL as-is.\n` : "";

    // Build a numbered citation list for the AI to pick from
    const citationList = citations.length > 0
      ? citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")
      : "(No citations available — leave url empty)";

    log("calling AI structuring");

    const aiBody = {
      messages: [
        {
          role: "system",
          content: `${langInstruction}Extract ONE market signal from the search results below. Return JSON: {"title":"5-12 word headline","body":"2-3 sentences with specific data points","source":"exact source/analyst name","url":"citation URL"}

HOLDER PERSPECTIVE FILTER (CRITICAL):
- If the search result is about short-term trading, chart patterns, entry/exit signals, or price targets, you MUST reframe it as a long-term holder insight instead
- Replace trading language ("buy signal", "breakout", "resistance") with holder language ("accumulation trend", "network growth", "supply dynamics")
- Focus on what the data means for someone holding Bitcoin for years, not days
- NEVER include phrases like "trading opportunity", "price target", "buy/sell signal", "chart pattern"

ACCURACY RULES (CRITICAL):
- Use ONLY data points, numbers, dates, and analyst names that appear in the search results
- Do NOT invent statistics, percentages, or metrics not present in the source material
- If the search results lack specific numbers, describe the trend qualitatively rather than fabricating data
- The body must contain ONLY verifiable claims from the search results

URL RULES (CRITICAL):
- You MUST select a url from the citation list below. Copy it character-for-character.
- If none match, use the FIRST citation URL.
- If no citations exist, set url to "".
- NEVER fabricate or shorten URLs. NEVER return partial domains like "glassnode.com".`,
        },
        {
          role: "user",
          content: `Search results:\n${searchContent}\n\nCitation URLs (pick one EXACTLY):\n${citationList}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    };

    const models = ["google/gemini-2.5-flash", "google/gemini-3-flash-preview"];
    let signal: any = null;
    let lastStatus = 500;

    for (const model of models) {
      const aiController = new AbortController();
      const aiTimeout = setTimeout(() => aiController.abort(), 18000);
      try {
        const structureResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...aiBody, model }),
          signal: aiController.signal,
        });
        clearTimeout(aiTimeout);

        log(`AI ${model} responded ${structureResponse.status}`);

        if (structureResponse.status === 429 || structureResponse.status === 402) {
          lastStatus = structureResponse.status;
          await structureResponse.text();
          break;
        }

        if (!structureResponse.ok) {
          const text = await structureResponse.text();
          console.error(`AI ${model} error:`, structureResponse.status, text);
          lastStatus = structureResponse.status;
          if (model !== models[models.length - 1]) { log(`Retrying with fallback model`); continue; }
          break;
        }

        const structureData = await structureResponse.json();
        const content = structureData.choices?.[0]?.message?.content;
        if (!content) {
          if (model !== models[models.length - 1]) { log(`Empty response, retrying`); continue; }
          throw new Error("No signal returned from AI");
        }

        try {
          signal = typeof content === "string" ? JSON.parse(content) : content;
        } catch {
          const m = (typeof content === "string" ? content : "").match(/\{[\s\S]*\}/);
          if (m) signal = JSON.parse(m[0]);
          else if (model !== models[models.length - 1]) { log(`Bad JSON, retrying`); continue; }
          else throw new Error("AI returned invalid JSON");
        }
        break;
      } catch (e) {
        clearTimeout(aiTimeout);
        if (e instanceof DOMException && e.name === "AbortError") {
          log(`AI ${model} timed out after 18s`);
          lastStatus = 504;
          if (model !== models[models.length - 1]) { log(`Retrying with fallback model`); continue; }
          return new Response(
            JSON.stringify({ error: "AI structuring timed out" }),
            { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw e;
      }
    }

    if (!signal) {
      if (lastStatus === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (lastStatus === 402) return new Response(JSON.stringify({ error: "AI usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI structuring failed after all retries");
    }

    // POST-PROCESSING: Force URL to be from citations
    // Check if AI URL matches any citation exactly
    const aiUrl = signal.url || "";
    const exactMatch = citations.find((c) => c === aiUrl);
    if (exactMatch) {
      signal.url = exactMatch;
    } else {
      // AI didn't use an exact citation — find best match or use first
      const partialMatch = citations.find((c) => aiUrl && c.includes(new URL(normalizeUrl(aiUrl)).hostname));
      signal.url = partialMatch || (citations.length > 0 ? citations[0] : "");
    }

    // Ensure URL is normalized
    if (signal.url && !signal.url.startsWith("http")) {
      signal.url = normalizeUrl(signal.url);
    }

    log(`done, signal: ${signal.title}, source: ${signal.source}, url: ${signal.url}`);
    return new Response(JSON.stringify(signal), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("signal-companion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
