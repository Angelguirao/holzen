import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_PRO_PRICE_ID = "price_1T9142I1yxxxpduPWh7kf9CI";
const PLAN_TIERS = new Set(["pro", "pro_plus"]);

serve(
  withRequestLogging("create-checkout", async ({ req }) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("Not authenticated");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    let requestedTier = "pro";
    try {
      const body = await req.json();
      const rawTier = typeof body?.planTier === "string" ? body.planTier.trim().toLowerCase() : "pro";
      requestedTier = PLAN_TIERS.has(rawTier) ? rawTier : "pro";
    } catch {
      requestedTier = "pro";
    }

    const priceIdPro = Deno.env.get("STRIPE_PRICE_ID_PRO") ?? DEFAULT_PRO_PRICE_ID;
    const priceIdProPlus = Deno.env.get("STRIPE_PRICE_ID_PRO_PLUS");
    const selectedPriceId =
      requestedTier === "pro_plus" && priceIdProPlus ? priceIdProPlus : priceIdPro;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${origin}/?subscribed=true`,
      cancel_url: `${origin}/`,
      subscription_data: {
        trial_period_days: 7,
        description: "Holzen — Bitcoin self-awareness companion",
        metadata: { plan_tier: requestedTier },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
