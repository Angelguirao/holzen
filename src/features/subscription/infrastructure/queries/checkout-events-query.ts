import type { CheckoutEvent } from '@/features/subscription/domain/checkout-event';
import { invokeListCheckoutEvents } from '../edge/subscription-query-edge';

export const CHECKOUT_EVENTS_QUERY_PREFIX = ['billing'] as const;

export const CHECKOUT_EVENTS_QUERY_LEAF = 'checkout-events' as const;

export const CHECKOUT_EVENTS_QUERY_KEY = [
  ...CHECKOUT_EVENTS_QUERY_PREFIX,
  CHECKOUT_EVENTS_QUERY_LEAF,
] as const;

export async function fetchCheckoutEvents(): Promise<CheckoutEvent[]> {
  const { data, error } = await invokeListCheckoutEvents();
  if (error) throw error;
  return data?.events ?? [];
}

export function getCheckoutEventsQueryOptions() {
  return {
    queryKey: CHECKOUT_EVENTS_QUERY_KEY,
    queryFn: fetchCheckoutEvents,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  } as const;
}
