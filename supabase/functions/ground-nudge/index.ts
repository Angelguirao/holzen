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

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const sbClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await sbClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { context, language, sources } = await req.json();

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langCode = language || "en";
    const langName = LANG_NAMES[langCode] || "English";

    // Build domain filter from user's active learning sources
    const domainFilter: string[] = [];
    if (sources && Array.isArray(sources) && sources.length > 0) {
      for (const s of sources) {
        if (s.url) {
          try {
            const domain = new URL(s.url).hostname.replace(/^www\./, '');
            domainFilter.push(domain);
          } catch { /* skip */ }
        }
      }
    }

    // Step 1: Perplexity search for behavioral finance research
    const marketContext = context || "Bitcoin market volatility";
    const searchQuery = `Behavioral finance research relevant to: ${marketContext}. Find a specific study, paper, or finding from behavioral economics, psychology, or neuroscience about investor decision-making during market volatility. Include researcher names and year of publication.`;

    const perplexityBody: any = {
      model: "sonar",
      messages: [
        {
          role: "system",
          content: "You are a behavioral finance research assistant. Search for real academic research, published papers, and credible findings about investor psychology and decision-making biases. Focus on loss aversion, panic selling, FOMO, herding behavior, disposition effect, anchoring, and emotional regulation. Always include specific researcher names, publication years, and factual findings.",
        },
        { role: "user", content: searchQuery },
      ],
      search_mode: "academic",
    };

    if (domainFilter.length > 0) {
      perplexityBody.search_domain_filter = domainFilter.slice(0, 5);
    }

    const searchResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(perplexityBody),
    });

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      console.error("Perplexity error:", searchResponse.status, errText);
      if (searchResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Perplexity search failed");
    }

    const searchData = await searchResponse.json();
    const searchContent = searchData.choices?.[0]?.message?.content || "";
    const citations: string[] = searchData.citations || [];

    // Step 2: Lovable AI structures the grounded result
    const langInstruction = langCode !== "en" ? `CRITICAL: Write title and body in ${langName}. Keep citation names and URLs as-is.\n\n` : "";

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
            content: `${langInstruction}You are a behavioral science curator for a Bitcoin mindfulness app. Given grounded research results with citations, extract ONE grounding nudge. Call the "return_nudge" function.

Rules:
- Use ONLY facts from the provided search results
- Reference specific researchers and years
- Title: short summary of the bias or finding
- Body: 2-3 sentences explaining the research and how it relates to the market context
- Citation: formatted like "Kahneman & Tversky (1979), Prospect Theory"
- URL: use one of the provided citation URLs
- Tone: calm, grounding, no advice`,
          },
          {
            role: "user",
            content: `Market context: ${marketContext}\n\nSearch results:\n${searchContent}\n\nAvailable citation URLs:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}\n\nExtract one grounding nudge.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_nudge",
              description: "Return a behavioral science grounding nudge with citation.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Short title summarizing the bias or finding." },
                  body: { type: "string", description: "2-3 sentence explanation referencing the study." },
                  citation: { type: "string", description: "Formatted citation like 'Kahneman & Tversky (1979), Prospect Theory'." },
                  url: { type: "string", description: "URL from the citations." },
                },
                required: ["title", "body", "citation", "url"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_nudge" } },
      }),
    });

    if (!structureResponse.ok) {
      if (structureResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (structureResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await structureResponse.text();
      console.error("AI structure error:", structureResponse.status, t);
      throw new Error("AI structuring failed");
    }

    const structureData = await structureResponse.json();
    const toolCall = structureData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const nudge = JSON.parse(toolCall.function.arguments);

    // Ensure URL is from citations
    if (citations.length > 0 && !citations.includes(nudge.url)) {
      nudge.url = citations[0];
    }

    return new Response(JSON.stringify(nudge), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ground-nudge error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
