import { trackedAssetSymbol, type MarketQuote } from '@/features/market/public';

export type PauseDepthContextLineParams = {
  sym: string;
  pct: string;
};

/** i18n interpolation inputs for the depth-picker market context line (no `t()` here). */
export function resolvePauseDepthContextLineParams(
  marketData: MarketQuote | null,
  trackedAssetId: string | null,
): PauseDepthContextLineParams | null {
  if (!marketData) return null;
  return {
    sym: trackedAssetSymbol(trackedAssetId),
    pct: Math.abs(marketData.changePercent).toFixed(1),
  };
}
