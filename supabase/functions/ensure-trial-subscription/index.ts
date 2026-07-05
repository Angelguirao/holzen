import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import {
  assertTrialEligible,
  isEmailVerified,
  type TrialDenyReason,
} from "../_shared/trial-eligibility.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function denyTrial(reason: TrialDenyReason, log: (event: string, fields?: Record<string, unknown>) => void): Response {
  log("trial_denied", { reason });
  return jsonResponse({
    ok: false,
    created: false,
    trial_eligible: false,
    reason,
  });
}

serve(
  withRequestLogging("ensure-trial-subscription", async ({ req, log }) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      const user = userData.user;
      if (userError || !user?.email) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      if (!isEmailVerified(user)) {
        return denyTrial("email_not_verified", log);
      }

      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } },
      );

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      const customerId = customers.data[0]?.id;

      const existing = customerId
        ? await stripe.subscriptions.list({
            customer: customerId,
            status: "all",
            limit: 20,
          })
        : { data: [] as Stripe.Subscription[] };

      const current = existing.data.find((s: Stripe.Subscription) =>
        s.status === "trialing" || s.status === "active"
      );

      if (current) {
        log("trial_exists", { status: current.status, subscription_id: current.id });
        return jsonResponse({
          ok: true,
          created: false,
          trial_eligible: true,
          subscription_status: current.status,
          trial_end: current.trial_end
            ? new Date(current.trial_end * 1000).toISOString()
            : null,
        });
      }

      const eligibility = await assertTrialEligible({
        svcClient: serviceClient,
        userId: user.id,
        email: user.email,
        stripeSubscriptions: existing.data,
      });
      if (!eligibility.eligible) {
        return denyTrial(eligibility.reason, log);
      }

      log("trial_checkout_required", { user_id: user.id });
      return jsonResponse({
        ok: false,
        created: false,
        trial_eligible: true,
        reason: "checkout_required",
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return jsonResponse({ error: msg }, 500);
    }
  }),
);
