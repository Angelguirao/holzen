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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Track AI usage
    try { await serviceClient.from("analytics_events").insert({ user_id: user.id, event: "zoom_out_ai_call" }); } catch (_) { /* non-fatal */ }

    const { context, reflectionMessage, language } = await req.json();

    // --- 1. Fetch "on this day" BTC prices with DB caching ---
    const today = new Date();
    const currentYear = today.getUTCFullYear();
    const month = today.getUTCMonth();
    const day = today.getUTCDate();

    // Build date keys for years 1-4 ago (reduced from 5)
    const yearTargets = [1, 2, 3, 4].map(y => {
      const d = new Date(Date.UTC(currentYear - y, month, day));
      return { yearsAgo: y, dateKey: d.toISOString().slice(0, 10), ts: Math.floor(d.getTime() / 1000) };
    });

    // Check cache first
    const dateKeys = yearTargets.map(t => t.dateKey);
    const { data: cached } = await serviceClient
      .from("btc_price_cache")
      .select("date, price")
      .in("date", dateKeys);

    const cachedMap = new Map((cached || []).map((r: any) => [r.date, r.price]));
    const missingTargets = yearTargets.filter(t => !cachedMap.has(t.dateKey));

    console.log(`[zoom-out] cache hit: ${cachedMap.size}/${yearTargets.length}, fetching ${missingTargets.length} from CoinGecko`);

    // Fetch only missing prices from CoinGecko (with conservative rate limiting)
    const newPrices: { date: string; price: number }[] = [];
    for (let i = 0; i < missingTargets.length; i++) {
      const target = missingTargets[i];
      if (i > 0) await new Promise(r => setTimeout(r, 1500)); // 1.5s delay between requests

      try {
        const from = target.ts - 86400;
        const to = target.ts + 86400;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (res.status === 429) {
          console.warn(`[zoom-out] CoinGecko 429 for ${target.dateKey}, skipping remaining`);
          await res.text();
          break; // Stop trying once rate limited
        }
        if (!res.ok) { await res.text(); continue; }

        const json = await res.json();
        if (json?.prices?.length > 0) {
          const price = Math.round(json.prices[0][1]);
          newPrices.push({ date: target.dateKey, price });
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          console.warn(`[zoom-out] CoinGecko timeout for ${target.dateKey}`);
        }
        // Continue with next
      }
    }

    // Cache new prices (fire-and-forget via service role)
    if (newPrices.length > 0) {
      serviceClient
        .from("btc_price_cache")
        .upsert(newPrices.map(p => ({ date: p.date, price: p.price, fetched_at: new Date().toISOString() })))
        .then(({ error }) => { if (error) console.warn("[zoom-out] cache write failed:", error.message); });
    }

    // Combine cached + freshly fetched
    const onThisDay: { yearsAgo: number; price: number; date: string }[] = [];
    for (const target of yearTargets) {
      const cached = cachedMap.get(target.dateKey);
      const fresh = newPrices.find(p => p.date === target.dateKey);
      const price = cached ?? fresh?.price;
      if (price) onThisDay.push({ yearsAgo: target.yearsAgo, date: target.dateKey, price: Math.round(price) });
    }

    // Current price
    let currentPrice: number | null = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        currentPrice = json?.bitcoin?.usd ? Math.round(json.bitcoin.usd) : null;
      } else { await res.text(); }
    } catch { /* ignore */ }

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

    // --- 3. Generate deep-time perspective via AI ---
    let deepTime: { title: string; body: string } | null = null;
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
        const langCode = language || "en";
        const langName = LANG_NAMES[langCode] || "English";
        const langInstruction = langCode !== "en" ? `CRITICAL LANGUAGE REQUIREMENT: You MUST write title and body in ${langName}.\n\n` : "";

        const priceContext = currentPrice ? `Current BTC price: $${currentPrice.toLocaleString()}.` : "";
        const historyContext = onThisDay.length > 0
          ? `BTC prices on this day: ${onThisDay.map(e => `${e.yearsAgo}y ago: $${e.price.toLocaleString()}`).join(", ")}.`
          : "";

        const systemPrompt = `${langInstruction}You generate ONE deep-time perspective for a Bitcoin mindfulness app. Your job is to zoom way out — beyond markets, beyond decades — into civilizational, planetary, or epochal timescales.

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
- Ground in real facts and numbers when possible.

You MUST respond by calling the "generate_deep_time" function.`;

        const aiController = new AbortController();
        const aiTimeout = setTimeout(() => aiController.abort(), 10000);

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
          signal: aiController.signal,
        });
        clearTimeout(aiTimeout);

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
        } else {
          await aiRes.text();
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
