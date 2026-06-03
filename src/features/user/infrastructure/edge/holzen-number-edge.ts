import { invokeEdge } from '@/lib/invoke-edge';

/** Public aggregate from `get_holzen_number()` (community pause activity). */
export type HolzenNumberData = {
  users_pausing_now: number;
  /** % of onboarded profiles in active | engaged pause right now. */
  percent_pausing_now: number;
  users_paused_today: number;
  /** % of onboarded profiles with a non-pending pause started today (UTC). */
  percent_paused_today: number;
  calculated_at: string;
};

/** Public aggregate stats (`holzen-number` edge; `invokeEdge` preserves `x-cid`). */
export function fetchHolzenNumberEdge() {
  return invokeEdge<HolzenNumberData>('holzen-number');
}
