export type MarketMoveSeverity = 'mild' | 'moderate' | 'high';

/** Buckets for reflection / ritual UI from absolute 24h move (whole % points, not tenths). */
export function severityFromMarketChangePercent(
  changePercent: number | null | undefined,
): MarketMoveSeverity {
  if (changePercent == null || Number.isNaN(changePercent)) return 'mild';
  const a = Math.abs(Math.trunc(changePercent));
  if (a >= 10) return 'high';
  if (a >= 5) return 'moderate';
  return 'mild';
}
