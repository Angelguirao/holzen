export type BtcMoveSeverity = 'mild' | 'moderate' | 'high';

/** Buckets for reflection / ritual UI from absolute 24h move (whole % points, not tenths). */
export function severityFromBtcChangePercent(changePercent: number | null | undefined): BtcMoveSeverity {
  if (changePercent == null || Number.isNaN(changePercent)) return 'mild';
  const a = Math.abs(Math.trunc(changePercent));
  if (a >= 10) return 'high';
  if (a >= 5) return 'moderate';
  return 'mild';
}
