import { invokeEdge } from '@/lib/invoke-edge';

export type AdminStripePriceCheckResult = {
  secret: string;
  label: string;
  ok: boolean;
  value: string | null;
  error: string | null;
  active?: boolean;
  type?: string;
  expected_type?: string;
  amount?: number | null;
  currency?: string | null;
};

export type AdminStripePriceCheckResponse = {
  ok: boolean;
  error?: string;
  results: AdminStripePriceCheckResult[];
};

/** Admin diagnostic — validates Stripe price ID secrets via edge (`invokeEdge` preserves `x-cid`). */
export function checkAdminStripePrices() {
  return invokeEdge<AdminStripePriceCheckResponse>('admin-check-stripe-prices', { body: {} });
}
