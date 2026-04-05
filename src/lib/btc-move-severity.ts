export type BtcMoveSeverity = 'mild' | 'moderate' | 'high';

/** Buckets for reflection / ritual UI from absolute 24h move (same thresholds as previous inline `useHolzen` logic). */
export function severityFromBtcChangePercent(changePercent: number | null | undefined): BtcMoveSeverity {
  if (changePercent == null || Number.isNaN(changePercent)) return 'mild';
  const a = Math.abs(changePercent);
  if (a >= 10) return 'high';
  if (a >= 5) return 'moderate';
  return 'mild';
}
