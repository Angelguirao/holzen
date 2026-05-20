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
