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
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid or empty request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { context, language, sources } = body;
    log("parsed body");

    // Track AI usage — fire-and-forget (no await)
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      (async () => {
        try {
          const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
          const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
          const sbUser = createClient(sbUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
          const { data: { user } } = await sbUser.auth.getUser();
          if (user) {
            const svc = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
            await svc.from("analytics_events").insert({ user_id: user.id, event: "signal_companion_ai_call" });
          }
        } catch (_) { /* non-fatal */ }
      })();
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build source name list for context (NOT domain filter — that over-constrains results)
    const sourceNames: string[] = [];
    if (sources && Array.isArray(sources) && sources.length > 0) {
      for (const s of sources) {
        if (s.name) sourceNames.push(s.name);
      }
    }

    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langCode = language || "en";
    const langName = LANG_NAMES[langCode] || "English";

    // Step 1: Perplexity search — use source names as context hints, not domain filters
    const sourceHint = sourceNames.length > 0
      ? ` Prefer insights from: ${sourceNames.slice(0, 8).join(", ")}.`
      : "";

    const searchQuery = context
      ? `Current Bitcoin market analysis: ${context}. Find one high-signal insight from a reputable Bitcoin analyst, researcher, or data source.${sourceHint}`
      : `Latest high-signal Bitcoin market analysis or insight from reputable analysts or researchers.${sourceHint}`;

    const perplexityBody: any = {
      model: "sonar",
      messages: [
        {
          role: "system",
          content: "You are a Bitcoin market research assistant. Find one specific, high-signal piece of Bitcoin analysis or insight. Use diverse sources — do NOT default to the same source every time. Rotate between analysts, blogs, newsletters, dashboards, and podcasts. Focus on real, verifiable information with working URLs.",
        },
        { role: "user", content: searchQuery },
      ],
      search_recency_filter: "week",
      // NOTE: Deliberately NOT using search_domain_filter — it over-constrains 
      // results and causes Perplexity to always return the same source (e.g. Glassnode)
    };

    log("calling perplexity");
    const perplexityController = new AbortController();
    const perplexityTimeout = setTimeout(() => perplexityController.abort(), 12000);

    let searchContent = "";
    let citations: string[] = [];

    try {
      const searchResponse = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(perplexityBody),
        signal: perplexityController.signal,
      });
      clearTimeout(perplexityTimeout);

      log(`perplexity responded ${searchResponse.status}`);

      if (!searchResponse.ok) {
        const errText = await searchResponse.text();
        console.error("Perplexity error:", searchResponse.status, errText);
        if (searchResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limited. Try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error("Perplexity search failed");
      }

      const searchData = await searchResponse.json();
      searchContent = searchData.choices?.[0]?.message?.content || "";
      citations = searchData.citations || [];
      log(`perplexity content length: ${searchContent.length}, citations: ${citations.length}`);
    } catch (e) {
      clearTimeout(perplexityTimeout);
      if (e instanceof DOMException && e.name === "AbortError") {
        log("perplexity timed out after 12s");
        return new Response(
          JSON.stringify({ error: "Search timed out" }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw e;
    }

    if (!searchContent) {
      throw new Error("No search content returned");
    }

    // Step 2: Use Lovable AI to structure the result with fallback model retry
    const langInstruction = langCode !== "en" ? `Write in ${langName}. Keep source name/URL as-is.\n` : "";

    // Build a numbered citation list for the AI
    const citationList = citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n");

    log("calling AI structuring");

    const aiBody = {
      messages: [
        {
          role: "system",
          content: `${langInstruction}Extract ONE signal from the search results as JSON: {"title":"5-12 word headline","body":"2-3 sentences, calm tone","source":"source name","url":"full citation URL from the list below"}.
CRITICAL URL RULES:
- You MUST pick a "url" value from the citation URLs listed below. Copy it EXACTLY.
- If no citation URL matches, use the FIRST citation URL.
- The URL must start with "https://" — never use partial URLs like "glassnode.com" or "N/A".
- Do NOT invent or fabricate URLs.`,
        },
        {
          role: "user",
          content: `Search results:\n${searchContent}\n\nAvailable citation URLs (pick one):\n${citationList}`,
        },
      ],
      response_format: { type: "json_object" },
    };

    const models = ["google/gemini-2.5-flash-lite", "google/gemini-2.5-flash"];
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

    // POST-PROCESSING: Validate and fix the URL
    // 1. If the AI returned a valid URL from citations, keep it
    // 2. If not, find the best citation URL
    // 3. Normalize all URLs to start with https://
    if (!isValidUrl(signal.url) || !signal.url.startsWith("http")) {
      // Try to find a matching citation
      const bestCitation = citations.find((c) => isValidUrl(c)) || "";
      signal.url = bestCitation ? normalizeUrl(bestCitation) : "";
    } else {
      signal.url = normalizeUrl(signal.url);
    }

    // Final fallback: if still no valid URL, use first citation
    if (!isValidUrl(signal.url) && citations.length > 0) {
      signal.url = normalizeUrl(citations[0]);
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
