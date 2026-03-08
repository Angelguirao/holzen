import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

    const { context, reflectionMessage, language } = await req.json();

    // --- 1. Fetch "on this day" BTC prices (sequential to avoid rate limits) ---
    const today = new Date();
    const dayMonth = { month: today.getUTCMonth(), day: today.getUTCDate() };

    const fetchHistoricalPrice = async (yearsAgo: number): Promise<{ price: number; date: string } | null> => {
      try {
        const targetDate = new Date(Date.UTC(today.getUTCFullYear() - yearsAgo, dayMonth.month, dayMonth.day));
        const ts = Math.floor(targetDate.getTime() / 1000);
        const from = ts - 86400;
        const to = ts + 86400;
        for (let attempt = 0; attempt < 3; attempt++) {
          const res = await fetch(
            `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
          );
          if (res.status === 429) {
            console.warn(`CoinGecko 429 for ${yearsAgo}y ago, attempt ${attempt + 1}`);
            await sleep(2000 * (attempt + 1));
            continue;
          }
          if (!res.ok) { await res.text(); return null; }
          const json = await res.json();
          if (json?.prices?.length > 0) {
            return {
              price: Math.round(json.prices[0][1]),
              date: targetDate.toISOString().slice(0, 10),
            };
          }
          return null;
        }
      } catch { /* ignore */ }
      return null;
    };

    // Current price
    let currentPrice: number | null = null;
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
      if (res.ok) {
        const json = await res.json();
        currentPrice = json?.bitcoin?.usd ? Math.round(json.bitcoin.usd) : null;
      }
    } catch { /* ignore */ }

    // Fetch sequentially with small delays to avoid rate limits
    const onThisDay: { yearsAgo: number; price: number; date: string }[] = [];
    for (let y = 1; y <= 5; y++) {
      if (y > 1) await sleep(500); // small delay between requests
      const result = await fetchHistoricalPrice(y);
      if (result) onThisDay.push({ yearsAgo: y, ...result });
    }

    // --- 2. Fetch a real past reflection for "echo" ---
    let echoReflection: { message: string; created_at: string; mood: string | null; outcome: string | null } | null = null;
    try {
      const direction = context?.toLowerCase().includes("is down") ? "down" : context?.toLowerCase().includes("is up") ? "up" : null;

      if (direction) {
        const { data } = await supabase
          .from("reflections")
          .select("message, created_at, mood, outcome, context")
          .eq("user_id", user.id)
          .not("outcome", "is", null)
          .lt("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
          .order("created_at", { ascending: false })
          .limit(50);

        if (data && data.length > 0) {
          const matching = data.filter((r: any) => {
            if (direction === "down") return r.context?.toLowerCase().includes("is down");
            return r.context?.toLowerCase().includes("is up");
          });
          const pool = matching.length > 0 ? matching : data;
          echoReflection = pool[Math.floor(Math.random() * Math.min(pool.length, 10))] as any;
        }
      } else {
        const { data } = await supabase
          .from("reflections")
          .select("message, created_at, mood, outcome")
          .eq("user_id", user.id)
          .not("outcome", "is", null)
          .lt("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
          .order("created_at", { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          echoReflection = data[0] as any;
        }
      }
    } catch { /* non-critical */ }

    // --- 3. Generate deep-time / macro perspective via AI ---
    let deepTime: { title: string; body: string } | null = null;
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
        const langCode = language || "en";
        const langName = LANG_NAMES[langCode] || "English";
        const langInstruction = langCode !== "en" ? `\n\nLANGUAGE: Write title and body in ${langName}.` : "";

        const priceContext = currentPrice ? `Current BTC price: $${currentPrice.toLocaleString()}.` : "";
        const historyContext = onThisDay.length > 0
          ? `BTC prices on this day: ${onThisDay.map(e => `${e.yearsAgo}y ago: $${e.price.toLocaleString()}`).join(", ")}.`
          : "";

        const systemPrompt = `You generate ONE deep-time perspective for a Bitcoin mindfulness app. Your job is to zoom way out — beyond markets, beyond decades — into civilizational, planetary, or epochal timescales.

Think like the Long Now Foundation. Think in centuries and millennia. Put today's price movement in the context of:
- Human civilization's relationship with money (shells, gold, paper, digital)
- Technological adoption curves (printing press: 50 years to transform Europe; internet: 30 years to connect the world)
- Planetary facts (Earth is 4.5B years old; modern humans: 300,000 years; agriculture: 10,000 years)
- The scale of Bitcoin (15 years old in a 5,000-year history of money)
- Deep time numbers (total gold ever mined, world population at BTC genesis vs now, global debt, energy from the sun)

Rules:
- Title: a short, evocative phrase (3-8 words). Not a sentence.
- Body: 1-2 sentences. Poetic but factual. Should make the reader feel the smallness of today's price move against deep time.
- No trading advice, no price predictions, no exclamation marks.
- Vary the theme: sometimes civilizational, sometimes planetary, sometimes about the nature of patience itself.
- Ground in real facts and numbers when possible.${langInstruction}

You MUST respond by calling the "generate_deep_time" function.`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `${context || "BTC is moving today."} ${priceContext} ${historyContext}` },
            ],
            tools: [{
              type: "function",
              function: {
                name: "generate_deep_time",
                description: "Generate a deep-time perspective.",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Short evocative title (3-8 words)." },
                    body: { type: "string", description: "1-2 sentences of deep-time perspective." },
                  },
                  required: ["title", "body"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "generate_deep_time" } },
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const args = typeof toolCall.function.arguments === "string"
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
            if (args.title && args.body) {
              deepTime = { title: args.title, body: args.body };
            }
          }
        }
      }
    } catch (e) {
      console.warn("Deep time generation failed:", e);
    }

    // --- 4. Build response ---
    const result = {
      onThisDay,
      currentPrice,
      echo: echoReflection
        ? {
            message: echoReflection.message,
            created_at: echoReflection.created_at,
            mood: echoReflection.mood,
            outcome: echoReflection.outcome,
          }
        : null,
      deepTime,
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
