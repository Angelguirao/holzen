import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { FLEX_PACK_CREDITS, type FlexPackType } from "../_shared/subscription-entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLEX_PACK_TYPES = new Set<FlexPackType>(["flex_pack_s", "flex_pack_m"]);

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
    let checkoutKind: "subscription" | FlexPackType = "subscription";
    let reactivation = false;
    try {
      const body = await req.json();
      const rawKind = typeof body?.checkoutKind === "string" ? body.checkoutKind.trim().toLowerCase() : "subscription";
      if (FLEX_PACK_TYPES.has(rawKind as FlexPackType)) {
        checkoutKind = rawKind as FlexPackType;
      }
      reactivation = body?.reactivation === true;
    } catch {
      checkoutKind = "subscription";
    }

    const priceIdPro = Deno.env.get("STRIPE_PRICE_ID_PRO");
    const priceIdPackS = Deno.env.get("STRIPE_PRICE_ID_FLEX_PACK_S");
    const priceIdPackM = Deno.env.get("STRIPE_PRICE_ID_FLEX_PACK_M");

    const selectedPriceId = checkoutKind === "subscription"
      ? priceIdPro
      : checkoutKind === "flex_pack_s"
        ? priceIdPackS
        : priceIdPackM;

    if (!selectedPriceId) {
      throw new Error(`Missing Stripe price id for checkout kind '${checkoutKind}'`);
    }

    const session = checkoutKind === "subscription"
      ? await stripe.checkout.sessions.create({
          customer: customerId,
          customer_email: customerId ? undefined : user.email,
          line_items: [{ price: selectedPriceId, quantity: 1 }],
          mode: "subscription",
          payment_method_collection: reactivation ? "always" : "if_required",
          allow_promotion_codes: true,
          success_url: `${origin}/?subscribed=true`,
          cancel_url: `${origin}/`,
          client_reference_id: user.id,
          metadata: {
            user_id: user.id,
            checkout_kind: "subscription",
            plan_tier: "pro",
          },
          subscription_data: {
            description: "Holzen — Bitcoin self-awareness companion",
            metadata: { plan_tier: "pro", user_id: user.id },
          },
        })
      : await stripe.checkout.sessions.create({
          customer: customerId,
          customer_email: customerId ? undefined : user.email,
          line_items: [{ price: selectedPriceId, quantity: 1 }],
          mode: "payment",
          allow_promotion_codes: true,
          success_url: `${origin}/settings?credits=true`,
          cancel_url: `${origin}/settings`,
          client_reference_id: user.id,
          metadata: {
            user_id: user.id,
            checkout_kind: checkoutKind,
            flex_pack_type: checkoutKind,
            flex_pack_credits: String(FLEX_PACK_CREDITS[checkoutKind]),
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
