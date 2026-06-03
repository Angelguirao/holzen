import { invokeEdge } from '@/lib/invoke-edge';

/** Public aggregate from `get_holzen_number()` (community pause activity). */
export type HolzenNumberData = {
  users_paused_today: number;
  /** % of onboarded profiles with a non-pending pause created today (UTC). */
  percent: number;
  calculated_at: string;
};

/** Public aggregate stats (`holzen-number` edge; `invokeEdge` preserves `x-cid`). */
export function fetchHolzenNumberEdge() {
  return invokeEdge<HolzenNumberData>('holzen-number');
}
