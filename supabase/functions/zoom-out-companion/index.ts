import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { context, reflectionMessage } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch historical BTC prices from CoinGecko (free, no API key needed)
    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - 365 * 86400;
    const fourYearsAgo = now - 4 * 365 * 86400;
    const tenYearsAgo = now - 10 * 365 * 86400;

    let priceData: { current?: number; oneYear?: number; fourYears?: number; tenYears?: number } = {};

    try {
      // Current price
      const currentRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      );
      const currentJson = await currentRes.json();
      priceData.current = currentJson?.bitcoin?.usd;

      // Historical prices - use market_chart/range for approximate dates
      const fetchHistorical = async (timestamp: number): Promise<number | undefined> => {
        try {
          const from = timestamp - 86400;
          const to = timestamp + 86400;
          const res = await fetch(
            `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
          );
          const json = await res.json();
          if (json?.prices?.length > 0) {
            return json.prices[0][1];
          }
        } catch {
          // ignore
        }
        return undefined;
      };

      const [p1y, p4y, p10y] = await Promise.all([
        fetchHistorical(oneYearAgo),
        fetchHistorical(fourYearsAgo),
        fetchHistorical(tenYearsAgo),
      ]);
      priceData.oneYear = p1y;
      priceData.fourYears = p4y;
      priceData.tenYears = p10y;
    } catch (e) {
      console.error("Price fetch error:", e);
    }

    // Fetch a past reflection from a similar context (if available)
    let pastReflection: { message: string; created_at: string; mood: string | null; outcome: string | null } | null = null;
    try {
      const { data: pastData } = await supabase
        .from("reflections")
        .select("message, created_at, mood, outcome")
        .eq("user_id", user.id)
        .not("outcome", "is", null)
        .order("created_at", { ascending: true })
        .limit(50);

      if (pastData && pastData.length > 0) {
        // Pick a random older reflection for perspective
        const idx = Math.floor(Math.random() * Math.min(pastData.length, 20));
        pastReflection = pastData[idx] as any;
      }
    } catch {
      // non-critical
    }

    // Build the AI prompt
    const priceContext = [];
    if (priceData.current && priceData.oneYear) {
      const change1y = ((priceData.current - priceData.oneYear) / priceData.oneYear * 100).toFixed(0);
      priceContext.push(`1 year ago: $${Math.round(priceData.oneYear).toLocaleString()} (${Number(change1y) >= 0 ? '+' : ''}${change1y}%)`);
    }
    if (priceData.current && priceData.fourYears) {
      const change4y = ((priceData.current - priceData.fourYears) / priceData.fourYears * 100).toFixed(0);
      priceContext.push(`4 years ago: $${Math.round(priceData.fourYears).toLocaleString()} (${Number(change4y) >= 0 ? '+' : ''}${change4y}%)`);
    }
    if (priceData.current && priceData.tenYears) {
      const change10y = ((priceData.current - priceData.tenYears) / priceData.tenYears * 100).toFixed(0);
      priceContext.push(`10 years ago: $${Math.round(priceData.tenYears).toLocaleString()} (${Number(change10y) >= 0 ? '+' : ''}${change10y}%)`);
    }

    const pastReflectionContext = pastReflection
      ? `\n\nThe user once wrote this reflection: "${pastReflection.message}" (on ${new Date(pastReflection.created_at).toLocaleDateString()}, outcome: ${pastReflection.outcome || 'unknown'})`
      : '';

    const systemPrompt = `You are a wise, grounding companion for a Bitcoin holder. Your role is to provide a "Zoom Out" perspective — helping them see the bigger picture beyond today's volatility.

You will receive the current market context, historical price data, and possibly a past reflection from the user.

Respond with a JSON object containing exactly these fields:
- "perspective": A 2-3 sentence grounding perspective combining the long-term price data with wisdom about cycles. Be specific with the numbers.
- "echo": If a past reflection is provided, write 1-2 sentences connecting it to the present moment — showing growth or consistency. If no past reflection, write a brief note about the value of building a reflection practice over time.
- "macro": A 1-2 sentence observation about where we are in the broader Bitcoin cycle (halving cycles, adoption trends, etc). Keep it factual and calming.

Be concise, grounding, and avoid hype. No emojis. Speak like a thoughtful mentor.`;

    const userPrompt = `Current context: ${context || 'BTC price movement'}
Current BTC price: $${priceData.current ? Math.round(priceData.current).toLocaleString() : 'unknown'}
Historical comparison:
${priceContext.length > 0 ? priceContext.join('\n') : 'Historical data unavailable'}
${pastReflectionContext}

Current reflection: "${reflectionMessage || ''}"`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "zoom_out",
                description: "Return the zoom out perspective data",
                parameters: {
                  type: "object",
                  properties: {
                    perspective: { type: "string", description: "Long-term price perspective (2-3 sentences)" },
                    echo: { type: "string", description: "Past reflection echo or practice encouragement (1-2 sentences)" },
                    macro: { type: "string", description: "Macro cycle context (1-2 sentences)" },
                  },
                  required: ["perspective", "echo", "macro"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "zoom_out" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    // Add price data to response
    result.prices = {
      current: priceData.current ? Math.round(priceData.current) : null,
      oneYear: priceData.oneYear ? Math.round(priceData.oneYear) : null,
      fourYears: priceData.fourYears ? Math.round(priceData.fourYears) : null,
      tenYears: priceData.tenYears ? Math.round(priceData.tenYears) : null,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("zoom-out error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
