import { createClient } from "npm:@supabase/supabase-js@2";
import { errorMessage } from "../_shared/error-message.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { fetchMarketQuoteCached } from "../_shared/market-quote.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cid, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(
  withRequestLogging("home-bootstrap", async ({ req }) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let coinId = "bitcoin";
    let currency = "USD";
    try {
      const body = await req.json();
      if (typeof body?.coinId === "string" && body.coinId.trim()) coinId = body.coinId.trim();
      if (typeof body?.currency === "string" && body.currency.trim()) currency = body.currency.trim();
    } catch {
      /* defaults */
    }

    try {
      const holzenNumberResult = await serviceClient.rpc("get_holzen_number");
      if (holzenNumberResult.error) throw holzenNumberResult.error;

      let market: Awaited<ReturnType<typeof fetchMarketQuoteCached>> | null = null;
      try {
        market = await fetchMarketQuoteCached(coinId, currency, "lite", req);
      } catch (marketErr) {
        console.warn("home-bootstrap: market quote unavailable", errorMessage(marketErr));
      }

      return new Response(
        JSON.stringify({
          holzenNumber: holzenNumberResult.data,
          market,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=60",
          },
        },
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: errorMessage(err) }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  }),
);
