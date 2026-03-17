import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Track AI usage (best-effort, non-blocking)
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
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
      log("tracked usage");
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build domain filter from user's active sources
    const domainFilter: string[] = [];
    if (sources && Array.isArray(sources) && sources.length > 0) {
      for (const s of sources) {
        if (s.url) {
          try {
            const domain = new URL(s.url).hostname.replace(/^www\./, '');
            domainFilter.push(domain);
          } catch { /* skip invalid URLs */ }
        }
      }
    }

    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langCode = language || "en";
    const langName = LANG_NAMES[langCode] || "English";

    // Step 1: Perplexity search with 12s timeout
    const searchQuery = context
      ? `Current Bitcoin market analysis: ${context}. Find one high-signal insight from a reputable Bitcoin analyst, researcher, or data source.`
      : "Latest high-signal Bitcoin market analysis or insight from reputable analysts or researchers.";

    const perplexityBody: any = {
      model: "sonar",
      messages: [
        {
          role: "system",
          content: "You are a Bitcoin market research assistant. Find one specific, high-signal piece of Bitcoin analysis or insight that is relevant to the current market conditions. Focus on real analysts, real data, and real sources. Provide factual, grounded information — no hype, no predictions.",
        },
        { role: "user", content: searchQuery },
      ],
      search_recency_filter: "week",
    };

    if (domainFilter.length > 0) {
      perplexityBody.search_domain_filter = domainFilter.slice(0, 5);
    }

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

    // Step 2: Use Lovable AI to structure the result with 10s timeout
    const langInstruction = langCode !== "en" ? `CRITICAL: Write title and body in ${langName}. Source name and URL remain as-is.\n\n` : "";

    log("calling AI structuring");
    const aiController = new AbortController();
    const aiTimeout = setTimeout(() => aiController.abort(), 10000);

    try {
      const structureResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `${langInstruction}You are a signal curator for a Bitcoin mindfulness app. Given grounded search results with real citations, extract ONE clean signal. You MUST call the "return_signal" function.

Rules:
- Use ONLY facts from the provided search results — do not invent anything
- Title: short headline (5-12 words), factual, not clickbait
- Body: 2-3 sentences max, calm and educational tone
- Source: name the actual source (analyst, publication, or data provider)
- URL: use one of the provided citation URLs. Pick the most relevant one.
- No hype, no advice, no predictions`,
            },
            {
              role: "user",
              content: `Search results:\n${searchContent}\n\nAvailable citation URLs:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}\n\nExtract one clean signal from these results.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_signal",
                description: "Return a curated Bitcoin signal/insight.",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Short headline (5-12 words)." },
                    body: { type: "string", description: "2-3 sentence insight." },
                    source: { type: "string", description: "Name of the source." },
                    url: { type: "string", description: "A real URL from the citations." },
                  },
                  required: ["title", "body", "source", "url"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_signal" } },
        }),
        signal: aiController.signal,
      });
      clearTimeout(aiTimeout);

      log(`AI responded ${structureResponse.status}`);

      if (!structureResponse.ok) {
        if (structureResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limited. Try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (structureResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI usage limit reached." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const text = await structureResponse.text();
        console.error("AI structure error:", structureResponse.status, text);
        throw new Error("AI structuring failed");
      }

      const structureData = await structureResponse.json();
      const toolCall = structureData.choices?.[0]?.message?.tool_calls?.[0];

      if (!toolCall?.function?.arguments) {
        throw new Error("No signal returned from AI");
      }

      let signal: any;
      try {
        signal = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse AI arguments:", toolCall.function.arguments);
        throw new Error("AI returned invalid JSON");
      }

      // Ensure URL is from citations if possible
      if (citations.length > 0 && !citations.includes(signal.url)) {
        signal.url = citations[0];
      }

      log(`done, signal: ${signal.title}`);
      return new Response(JSON.stringify(signal), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      clearTimeout(aiTimeout);
      if (e instanceof DOMException && e.name === "AbortError") {
        log("AI timed out after 10s");
        return new Response(
          JSON.stringify({ error: "AI structuring timed out" }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw e;
    }
  } catch (e) {
    console.error("signal-companion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
