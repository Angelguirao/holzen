import { invokeEdge } from '@/lib/invoke-edge';
import type { CheckoutEvent } from '@/features/subscription/domain/checkout-event';

export type CheckSubscriptionResponse = Record<string, unknown>;

/** Entitlement snapshot for signed-in user (`check-subscription` edge). */
export function invokeCheckSubscription(force?: boolean) {
  return invokeEdge<CheckSubscriptionResponse>('check-subscription', {
    body: force ? { force: true } : undefined,
  });
}

export type ListCheckoutEventsResponse = { events?: CheckoutEvent[] };

/** Billing history rows for settings (`list-checkout-events` edge). */
export function invokeListCheckoutEvents() {
  return invokeEdge<ListCheckoutEventsResponse>('list-checkout-events', { body: {} });
}
