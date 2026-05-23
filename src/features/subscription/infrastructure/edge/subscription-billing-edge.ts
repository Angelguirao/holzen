import { invokeEdge } from '@/lib/invoke-edge';

export type CreateCheckoutBody =
  | { checkoutKind: 'flex_pack_s' | 'flex_pack_m' }
  | {
      checkoutKind: 'subscription';
      planTier: 'pro' | 'pro_plus';
      reactivation?: boolean;
    };

export type CreateCheckoutResponse = { url?: string };

export type EnsureTrialSubscriptionResponse = { ok?: boolean; created?: boolean };

export type CustomerPortalResponse = { url?: string };

/** Stripe Checkout session URL (`create-checkout` edge; `invokeEdge` preserves `x-cid`). */
export function createCheckoutSession(body: CreateCheckoutBody) {
  return invokeEdge<CreateCheckoutResponse>('create-checkout', { body });
}

/** Idempotent trial start for signed-in user (`ensure-trial-subscription` edge). */
export function ensureTrialSubscription() {
  return invokeEdge<EnsureTrialSubscriptionResponse>('ensure-trial-subscription', { body: {} });
}

/** Stripe billing portal URL (`customer-portal` edge). */
export function openCustomerPortal() {
  return invokeEdge<CustomerPortalResponse>('customer-portal');
}

export type CheckoutConfirmationMode = 'subscription' | 'flex_pack_s' | 'flex_pack_m';

/** Payload for post-checkout email/push summary (`notify-checkout-confirmation` edge). */
export type NotifyCheckoutConfirmationBody = {
  mode: CheckoutConfirmationMode;
  tierLabel?: string;
  isTrialing?: boolean;
  trialStart?: string | null;
  firstChargeAt?: string | null;
  monthlyPrice?: string;
  companionUnlocks?: number;
  wallpapers?: number;
  flexCreditsBalance?: number;
  packLabel?: string;
  previousBalance?: number;
  creditsAdded?: number;
  newBalance?: number;
};

export type NotifyCheckoutConfirmationResponse = {
  emailed?: boolean;
  pushed?: number;
  skipped?: string | null;
};

export type RetryFlexCreditResponse = {
  applied?: unknown;
  scanned?: unknown;
};

/** Optional checkout confirmation email/push (`notify-checkout-confirmation` edge). */
export function notifyCheckoutConfirmation(body: NotifyCheckoutConfirmationBody) {
  return invokeEdge<NotifyCheckoutConfirmationResponse>('notify-checkout-confirmation', { body });
}

/** Replay flex-pack credit grants when webhook missed (`retry-flex-credit` edge). */
export function retryFlexCredit() {
  return invokeEdge<RetryFlexCreditResponse>('retry-flex-credit');
}
