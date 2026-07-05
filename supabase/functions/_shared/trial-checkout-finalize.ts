import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type Stripe from "https://esm.sh/stripe@18.5.0";
import type { createLogger } from "../_shared/observe.ts";
import { syncProfileFromStripeSubscription } from "./subscription-profile-sync.ts";
import {
  findPaymentMethodFingerprintOwner,
  markPaymentMethodFingerprint,
  markTrialConsumed,
} from "./trial-eligibility.ts";

export const TRIAL_CHECKOUT_METADATA = "true";

type EdgeLog = ReturnType<typeof createLogger>;

export type TrialCheckoutFinalizeResult = "ok" | "card_already_used" | "prepaid_not_allowed";

type ResolvedTrialPaymentMethod = {
  fingerprint: string | null;
  funding: string | null;
};

async function resolveDefaultTrialPaymentMethod(
  stripe: Stripe,
  sub: Stripe.Subscription,
): Promise<ResolvedTrialPaymentMethod> {
  const raw = sub.default_payment_method;
  const paymentMethodId = typeof raw === "string" ? raw : raw?.id;
  if (!paymentMethodId) return { fingerprint: null, funding: null };

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  const fingerprint = paymentMethod.card?.fingerprint;
  return {
    fingerprint: typeof fingerprint === "string" && fingerprint.length > 0 ? fingerprint : null,
    funding: paymentMethod.card?.funding ?? null,
  };
}

async function cancelTrialSubscription(
  stripe: Stripe,
  subId: string,
): Promise<void> {
  await stripe.subscriptions.cancel(subId);
}

/** Trial checkout: bind card fingerprint, cancel at trial end (no auto-charge), sync profile. */
export async function finalizeTrialCheckoutSubscription(args: {
  stripe: Stripe;
  svcClient: SupabaseClient;
  sub: Stripe.Subscription;
  userId: string;
  email: string;
  proPriceId: string | null;
  log: EdgeLog;
}): Promise<TrialCheckoutFinalizeResult> {
  const { stripe, svcClient, sub, userId, email, proPriceId, log } = args;

  const paymentMethod = await resolveDefaultTrialPaymentMethod(stripe, sub);
  const cardFingerprint = paymentMethod.fingerprint;

  if (paymentMethod.funding === "prepaid") {
    log.warn("trial_checkout_prepaid_rejected", {
      user_id: userId,
      subscription_id: sub.id,
    });
    await cancelTrialSubscription(stripe, sub.id);
    return "prepaid_not_allowed";
  }

  if (cardFingerprint) {
    const owner = await findPaymentMethodFingerprintOwner(svcClient, cardFingerprint);
    if (owner && owner !== userId) {
      log.warn("trial_checkout_card_fingerprint_reused", {
        user_id: userId,
        existing_user_id: owner,
        subscription_id: sub.id,
      });
      await cancelTrialSubscription(stripe, sub.id);
      return "card_already_used";
    }
  }

  let activeSub = sub;
  if (
    activeSub.status === "trialing" &&
    typeof activeSub.trial_end === "number" &&
    activeSub.trial_end > 0 &&
    !activeSub.cancel_at
  ) {
    activeSub = await stripe.subscriptions.update(activeSub.id, {
      cancel_at: activeSub.trial_end,
    });
    log("trial_checkout_cancel_at_trial_end", {
      subscription_id: activeSub.id,
      cancel_at: activeSub.cancel_at,
    });
  }

  if (cardFingerprint) {
    await markPaymentMethodFingerprint(svcClient, userId, cardFingerprint);
  }

  await markTrialConsumed(svcClient, userId, email);
  await syncProfileFromStripeSubscription(svcClient, userId, activeSub, proPriceId);

  return "ok";
}

export function isTrialCheckoutSession(session: Stripe.Checkout.Session): boolean {
  return session.metadata?.trial === TRIAL_CHECKOUT_METADATA;
}
