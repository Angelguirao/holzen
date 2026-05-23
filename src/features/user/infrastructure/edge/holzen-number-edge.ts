import { invokeEdge } from '@/lib/invoke-edge';

export type HolzenNumberData = {
  total: number;
  held_steady: number;
  percent: number;
  calculated_at: string;
};

/** Public aggregate stats (`holzen-number` edge; `invokeEdge` preserves `x-cid`). */
export function fetchHolzenNumberEdge() {
  return invokeEdge<HolzenNumberData>('holzen-number');
}
