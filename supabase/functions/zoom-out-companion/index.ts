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

    // --- 1. Fetch "on this day" BTC prices from CoinGecko ---
    const now = Math.floor(Date.now() / 1000);
    const today = new Date();
    const dayMonth = { month: today.getUTCMonth(), day: today.getUTCDate() };

    const fetchHistoricalPrice = async (yearsAgo: number): Promise<{ price: number; date: string } | null> => {
      try {
        const targetDate = new Date(Date.UTC(today.getUTCFullYear() - yearsAgo, dayMonth.month, dayMonth.day));
        const ts = Math.floor(targetDate.getTime() / 1000);
        const from = ts - 86400;
        const to = ts + 86400;
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
        );
        const json = await res.json();
        if (json?.prices?.length > 0) {
          return {
            price: Math.round(json.prices[0][1]),
            date: targetDate.toISOString().slice(0, 10),
          };
        }
      } catch { /* ignore */ }
      return null;
    };

    // Current price
    let currentPrice: number | null = null;
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
      const json = await res.json();
      currentPrice = json?.bitcoin?.usd ? Math.round(json.bitcoin.usd) : null;
    } catch { /* ignore */ }

    // Fetch 1y, 2y, 3y, 4y, 5y ago on this same calendar day
    const [p1, p2, p3, p4, p5] = await Promise.all([
      fetchHistoricalPrice(1),
      fetchHistoricalPrice(2),
      fetchHistoricalPrice(3),
      fetchHistoricalPrice(4),
      fetchHistoricalPrice(5),
    ]);

    const onThisDay = [p1, p2, p3, p4, p5]
      .map((p, i) => p ? { yearsAgo: i + 1, ...p } : null)
      .filter(Boolean) as { yearsAgo: number; price: number; date: string }[];

    // --- 2. Fetch a real past reflection for "echo" ---
    let echoReflection: { message: string; created_at: string; mood: string | null; outcome: string | null } | null = null;
    try {
      // Find a reflection from a similar context (same direction) at least 14 days old
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
          // Filter by same direction
          const matching = data.filter((r: any) => {
            if (direction === "down") return r.context?.toLowerCase().includes("is down");
            return r.context?.toLowerCase().includes("is up");
          });
          const pool = matching.length > 0 ? matching : data;
          echoReflection = pool[Math.floor(Math.random() * Math.min(pool.length, 10))] as any;
        }
      } else {
        // No direction context — just get any old reflection
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

    // --- 3. Build response ---
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
