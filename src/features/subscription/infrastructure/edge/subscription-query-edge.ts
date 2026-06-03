import { invokeEdge } from '@/lib/invoke-edge';
import type { CheckoutEvent } from '@/features/subscription/domain/checkout-event';

export type CheckSubscriptionResponse = Record<string, unknown>;

export type CheckSubscriptionInvokeOptions = {
  /** Reconcile with Stripe (settings refresh, checkout return). */
  force?: boolean;
  /** Live usage/credits from Postgres only — skip Stripe. */
  usageOnly?: boolean;
};

/** Entitlement snapshot for signed-in user (`check-subscription` edge). */
export function invokeCheckSubscription(options?: CheckSubscriptionInvokeOptions) {
  const body: Record<string, boolean> = {};
  if (options?.force) body.force = true;
  if (options?.usageOnly) body.usage_only = true;
  return invokeEdge<CheckSubscriptionResponse>('check-subscription', {
    body: Object.keys(body).length > 0 ? body : undefined,
  });
}

export type ListCheckoutEventsResponse = { events?: CheckoutEvent[] };

/** Billing history rows for settings (`list-checkout-events` edge). */
export function invokeListCheckoutEvents() {
  return invokeEdge<ListCheckoutEventsResponse>('list-checkout-events', { body: {} });
}
