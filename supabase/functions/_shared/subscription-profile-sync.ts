import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import type Stripe from "https://esm.sh/stripe@18.5.0";
import {
  isActiveSubscriptionStatus,
  tierFromStripePriceId,
  type SubscriptionTier,
} from "./subscription-entitlements.ts";

export type HolzenEntitlement = "pre_trial" | "trialing" | "active" | "lapsed";

export function entitlementFromHolzenStatus(
  subscribed: boolean,
  subscriptionStatus: string | null | undefined,
): HolzenEntitlement {
  if (subscribed) {
    return subscriptionStatus === "trialing" ? "trialing" : "active";
  }
  if (subscriptionStatus === "lapsed") return "lapsed";
  return "pre_trial";
}

/** Map Stripe + customer presence to profiles.subscription_status (§5.4). */
export function resolveHolzenSubscriptionStatus(args: {
  hasStripeCustomer: boolean;
  stripeSubscriptionStatus: string | null | undefined;
}): string {
  if (isActiveSubscriptionStatus(args.stripeSubscriptionStatus)) {
    return args.stripeSubscriptionStatus as string;
  }
  if (args.hasStripeCustomer) return "lapsed";
  return "free";
}

function parseSubscriptionEndIso(sub: Stripe.Subscription): string | null {
  const itemEnd = sub.items?.data?.[0]?.current_period_end;
  const raw = itemEnd ?? sub.current_period_end ?? sub.billing_cycle_anchor;
  try {
    if (typeof raw === "number") return new Date(raw * 1000).toISOString();
    if (typeof raw === "string") return new Date(raw).toISOString();
  } catch {
    /* ignore */
  }
  return null;
}

export function profileFieldsFromStripeSubscription(
  sub: Stripe.Subscription,
  proPriceId: string | null,
  proPlusPriceId: string | null,
): {
  subscription_status: string;
  subscription_tier: SubscriptionTier;
  subscription_end: string | null;
} {
  const hasActive = isActiveSubscriptionStatus(sub.status);
  if (hasActive) {
    const priceId = sub.items?.data?.[0]?.price?.id ?? null;
    return {
      subscription_status: sub.status,
      subscription_tier: tierFromStripePriceId({
        hasActive: true,
        priceId,
        proPriceId,
        proPlusPriceId,
      }),
      subscription_end: parseSubscriptionEndIso(sub),
    };
  }
  return {
    subscription_status: "lapsed",
    subscription_tier: "free",
    subscription_end: parseSubscriptionEndIso(sub),
  };
}

export function userIdFromStripeSubscription(sub: Stripe.Subscription): string | null {
  const id = sub.metadata?.user_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function userIdFromStripeCustomer(
  stripe: Stripe,
  customerId: string,
): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  const id = customer.metadata?.user_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function resolveUserIdForSubscription(
  stripe: Stripe,
  sub: Stripe.Subscription,
): Promise<string | null> {
  const fromSub = userIdFromStripeSubscription(sub);
  if (fromSub) return fromSub;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  return userIdFromStripeCustomer(stripe, customerId);
}

export async function writeProfileSubscriptionCache(
  svcClient: SupabaseClient,
  userId: string,
  fields: {
    subscription_status: string;
    subscription_tier: SubscriptionTier;
    subscription_end: string | null;
  },
): Promise<void> {
  const { error } = await svcClient
    .from("profiles")
    .update({
      subscription_status: fields.subscription_status,
      subscription_tier: fields.subscription_tier,
      subscription_end: fields.subscription_end,
      subscription_checked_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function syncProfileFromStripeSubscription(
  svcClient: SupabaseClient,
  userId: string,
  sub: Stripe.Subscription,
  proPriceId: string | null,
  proPlusPriceId: string | null,
): Promise<void> {
  const fields = profileFieldsFromStripeSubscription(sub, proPriceId, proPlusPriceId);
  await writeProfileSubscriptionCache(svcClient, userId, fields);
}
