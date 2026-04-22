import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import {
  FLEX_PACK_CREDITS,
  grantFlexCredits,
  type FlexPackType,
} from "../_shared/subscription-entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Manually replays the credit-grant side-effect of recent paid flex-pack
 * checkout sessions for the authenticated user.
 *
 * Used as a self-service recovery when the Stripe webhook didn't fire (e.g.
 * misconfigured endpoint, transient 5xx, or local-only secret drift).
 *
 * Idempotent: `add_flex_credits` deduplicates by `(source, source_ref)`, so
 * sessions that already had credits granted via the webhook return
 * `{ applied: false, duplicate: true }` and don't double-credit.
 */
serve(
  withRequestLogging("retry-flex-credit", async ({ req, log }) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const svcClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Look up the customer by email.
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (!customers.data.length) {
      return new Response(
        JSON.stringify({ ok: true, scanned: 0, applied: 0, sessions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const customerId = customers.data[0].id;

    // Pull the 10 most recent checkout sessions for this customer.
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 10,
    });

    let applied = 0;
    const results: Array<{
      session_id: string;
      pack_type: string | null;
      credits: number;
      payment_status: string;
      applied: boolean;
      duplicate: boolean;
      balance: number | null;
      reason?: string;
    }> = [];

    for (const session of sessions.data) {
      const kind = session.metadata?.checkout_kind ?? null;
      const packType = session.metadata?.flex_pack_type ?? null;
      const sessionUserId = session.metadata?.user_id ?? session.client_reference_id ?? null;

      // Only act on paid flex-pack sessions belonging to this user.
      if (!kind || kind === "subscription") continue;
      if (!packType || !(packType in FLEX_PACK_CREDITS)) continue;
      if (sessionUserId !== user.id) continue;
      if (session.payment_status !== "paid") {
        results.push({
          session_id: session.id,
          pack_type: packType,
          credits: 0,
          payment_status: session.payment_status ?? "unknown",
          applied: false,
          duplicate: false,
          balance: null,
          reason: "not_paid",
        });
        continue;
      }

      const credits = FLEX_PACK_CREDITS[packType as FlexPackType];

      // Use a deterministic source_ref so the webhook and this retry path
      // dedupe against each other. We can't see the webhook event.id from
      // here, so namespace by checkout session id with a distinct prefix that
      // the webhook also collapses to (we additionally write the session id
      // into metadata so support can correlate).
      const grant = await grantFlexCredits(svcClient, {
        userId: user.id,
        credits,
        reason: "flex_pack_purchase_retry",
        source: "stripe_checkout",
        sourceRef: `cs:${session.id}`,
        metadata: {
          checkout_session_id: session.id,
          pack_type: packType,
          source_kind: "manual_retry",
        },
      });

      if (grant.applied) applied += 1;
      results.push({
        session_id: session.id,
        pack_type: packType,
        credits,
        payment_status: session.payment_status,
        applied: grant.applied,
        duplicate: grant.duplicate ?? false,
        balance: grant.balance,
      });
    }

    log("flex credits retry processed", {
      user_id: user.id,
      scanned: sessions.data.length,
      applied,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        scanned: sessions.data.length,
        applied,
        sessions: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }),
);
