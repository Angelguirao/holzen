import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { syncProfileFromStripeSubscription } from "../_shared/subscription-profile-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRIAL_DAYS = 7;

serve(
  withRequestLogging("ensure-trial-subscription", async ({ req, log }) => {
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

    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

      const priceIdPro = Deno.env.get("STRIPE_PRICE_ID_PRO");
      if (!priceIdPro) throw new Error("Missing STRIPE_PRICE_ID_PRO");

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      const user = userData.user;
      if (userError || !user?.email) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      let customerId = customers.data[0]?.id;
      if (!customerId) {
        const created = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id },
        });
        customerId = created.id;
      }

      const existing = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 20,
      });

      const current = existing.data.find((s: Stripe.Subscription) =>
        s.status === "trialing" || s.status === "active"
      );

      if (current) {
        log("trial_exists", { status: current.status, subscription_id: current.id });
        return new Response(
          JSON.stringify({
            ok: true,
            created: false,
            subscription_status: current.status,
            trial_end: current.trial_end
              ? new Date(current.trial_end * 1000).toISOString()
              : null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceIdPro }],
        trial_period_days: TRIAL_DAYS,
        trial_settings: { end_behavior: "cancel" },
        metadata: { user_id: user.id, plan_tier: "pro", source: "ensure_trial" },
      });

      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } },
      );
      await syncProfileFromStripeSubscription(
        serviceClient,
        user.id,
        subscription,
        priceIdPro,
        Deno.env.get("STRIPE_PRICE_ID_PRO_PLUS") ?? null,
      );

      log("trial_created", { subscription_id: subscription.id, status: subscription.status });

      return new Response(
        JSON.stringify({
          ok: true,
          created: true,
          subscription_status: subscription.status,
          trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
);
