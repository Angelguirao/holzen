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
