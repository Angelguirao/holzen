import { invokeEdge } from '@/lib/invoke-edge';

export type CheckoutEvent = {
  session_id: string;
  created: number;
  kind: string | null;
  pack_type: string | null;
  expected_credits: number;
  amount_total: number | null;
  currency: string | null;
  payment_status: string;
  status: string | null;
  grant_status: 'applied' | 'pending' | 'not_applicable';
  granted_credits: number | null;
  granted_at: string | null;
  grant_reason: string | null;
};

export const CHECKOUT_EVENTS_QUERY_KEY = ['billing', 'checkout-events'] as const;

export async function fetchCheckoutEvents(): Promise<CheckoutEvent[]> {
  const { data, error } = await invokeEdge<{ events?: CheckoutEvent[] }>('list-checkout-events', {
    body: {},
  });
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
