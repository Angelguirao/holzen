import { trackedAssetSymbol, type BtcPriceData } from '@/features/market/public';

export type PauseDepthContextLineParams = {
  sym: string;
  pct: string;
};

/** i18n interpolation inputs for the depth-picker market context line (no `t()` here). */
export function resolvePauseDepthContextLineParams(
  btcData: BtcPriceData | null,
  trackedAssetId: string | null,
): PauseDepthContextLineParams | null {
  if (!btcData) return null;
  return {
    sym: trackedAssetSymbol(trackedAssetId),
    pct: Math.abs(btcData.changePercent).toFixed(1),
  };
}
