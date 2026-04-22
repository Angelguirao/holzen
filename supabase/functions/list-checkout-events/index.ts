import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import {
  FLEX_PACK_CREDITS,
  type FlexPackType,
} from "../_shared/subscription-entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Returns the most recent Stripe checkout sessions for the signed-in user,
 * cross-referenced with the credit ledger so the UI can surface whether each
 * flex-pack purchase resulted in an applied grant or a duplicate (no-op)
 * grant. Read-only; does not mutate Stripe or our DB.
 */
serve(
  withRequestLogging("list-checkout-events", async ({ req }) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "GET" && req.method !== "POST") {
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

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (!customers.data.length) {
      return new Response(
        JSON.stringify({ events: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const customerId = customers.data[0].id;

    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 15,
    });

    // Pull all matching ledger rows in one query so we can show grant status
    // (applied vs duplicate-collapsed) per checkout session.
    const sourceRefs = sessions.data.map((s) => `cs:${s.id}`);
    const { data: ledgerRows } = await svcClient
      .from("credit_ledger")
      .select("source_ref, delta_credits, reason, created_at, metadata")
      .eq("user_id", user.id)
      .eq("source", "stripe_checkout")
      .in("source_ref", sourceRefs);

    const ledgerByRef = new Map<string, Array<{
      delta_credits: number;
      reason: string;
      created_at: string;
      metadata: Record<string, unknown> | null;
    }>>();
    for (const row of ledgerRows ?? []) {
      const ref = row.source_ref as string;
      if (!ref) continue;
      const list = ledgerByRef.get(ref) ?? [];
      list.push({
        delta_credits: row.delta_credits as number,
        reason: row.reason as string,
        created_at: row.created_at as string,
        metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      });
      ledgerByRef.set(ref, list);
    }

    const events = sessions.data.map((session) => {
      const kind = session.metadata?.checkout_kind ?? null;
      const packType = session.metadata?.flex_pack_type ?? null;
      const expectedCredits =
        packType && packType in FLEX_PACK_CREDITS
          ? FLEX_PACK_CREDITS[packType as FlexPackType]
          : 0;
      const ledger = ledgerByRef.get(`cs:${session.id}`) ?? [];
      const granted = ledger.find((row) => row.delta_credits > 0) ?? null;

      // For a paid flex-pack session: if no positive ledger row exists, the
      // grant either hasn't been applied yet (webhook lag) or failed. If one
      // does, the first positive row is the "applied" grant; any additional
      // attempts (e.g. manual retry) collapsed into the same source_ref and
      // are recorded by the RPC as duplicates (no extra ledger row written).
      let grantStatus: "applied" | "pending" | "not_applicable" = "not_applicable";
      if (kind && kind !== "subscription" && session.payment_status === "paid" && expectedCredits > 0) {
        grantStatus = granted ? "applied" : "pending";
      }

      return {
        session_id: session.id,
        created: session.created, // unix seconds
        kind,
        pack_type: packType,
        expected_credits: expectedCredits,
        amount_total: session.amount_total ?? null,
        currency: session.currency ?? null,
        payment_status: session.payment_status ?? "unknown",
        status: session.status ?? null,
        grant_status: grantStatus,
        granted_credits: granted?.delta_credits ?? null,
        granted_at: granted?.created_at ?? null,
        grant_reason: granted?.reason ?? null,
      };
    });

    return new Response(
      JSON.stringify({ events }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }),
);