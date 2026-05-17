import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import type { createLogger } from "../_shared/observe.ts";
import {
  FLEX_PACK_CREDITS,
  grantFlexCredits,
  type FlexPackType,
} from "../_shared/subscription-entitlements.ts";
import {
  resolveUserIdForSubscription,
  syncProfileFromStripeSubscription,
} from "../_shared/subscription-profile-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUBSCRIPTION_EVENT_TYPES = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

function resolvePackCredits(pack: string | null | undefined): number {
  if (!pack) return 0;
  if (pack in FLEX_PACK_CREDITS) {
    return FLEX_PACK_CREDITS[pack as FlexPackType];
  }
  return 0;
}

type EdgeLog = ReturnType<typeof createLogger>;

async function syncSubscriptionProfile(
  stripe: Stripe,
  svcClient: SupabaseClient,
  sub: Stripe.Subscription,
  log: EdgeLog,
): Promise<void> {
  const userId = await resolveUserIdForSubscription(stripe, sub);
  if (!userId) {
    log.warn("stripe_webhook_subscription_no_user", {
      subscription_id: sub.id,
      customer: sub.customer,
    });
    return;
  }

  const proPriceId = Deno.env.get("STRIPE_PRICE_ID_PRO") ?? null;
  const proPlusPriceId = Deno.env.get("STRIPE_PRICE_ID_PRO_PLUS") ?? null;

  await syncProfileFromStripeSubscription(svcClient, userId, sub, proPriceId, proPlusPriceId);

  log("subscription profile cache updated", {
    user_id: userId,
    subscription_id: sub.id,
    status: sub.status,
  });
}

serve(
  withRequestLogging("stripe-webhook", async ({ req, log }) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) {
      return new Response(JSON.stringify({ error: "Stripe webhook secrets not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return new Response(JSON.stringify({ error: `Invalid signature: ${msg}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const svcClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    if (SUBSCRIPTION_EVENT_TYPES.has(event.type)) {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscriptionProfile(stripe, svcClient, sub, log);
    }

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const kind = session.metadata?.checkout_kind ?? null;
      const packType = session.metadata?.flex_pack_type ?? null;
      const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;

      if (session.mode === "subscription" && userId) {
        const subRef = session.subscription;
        if (subRef) {
          const subId = typeof subRef === "string" ? subRef : subRef.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncProfileFromStripeSubscription(
            svcClient,
            userId,
            sub,
            Deno.env.get("STRIPE_PRICE_ID_PRO") ?? null,
            Deno.env.get("STRIPE_PRICE_ID_PRO_PLUS") ?? null,
          );
          log("checkout subscription profile cache updated", {
            user_id: userId,
            checkout_session_id: session.id,
            subscription_id: sub.id,
            status: sub.status,
          });
        }
      }

      if (kind && kind !== "subscription" && packType && userId) {
        const credits = resolvePackCredits(packType);
        if (credits > 0) {
          const grant = await grantFlexCredits(svcClient, {
            userId,
            credits,
            reason: "flex_pack_purchase",
            source: "stripe_checkout",
            // Use the checkout session id (not the webhook event id) as the
            // dedupe ref so the manual `retry-flex-credit` recovery path
            // collapses to the same ledger row and never double-credits.
            sourceRef: `cs:${session.id}`,
            metadata: {
              checkout_session_id: session.id,
              stripe_event_id: event.id,
              stripe_event_type: event.type,
              pack_type: packType,
            },
          });

          log("flex credits grant processed", {
            event_id: event.id,
            checkout_session_id: session.id,
            user_id: userId,
            pack_type: packType,
            credits,
            applied: grant.applied,
            duplicate: grant.duplicate ?? false,
            balance: grant.balance,
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true, type: event.type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }),
);
