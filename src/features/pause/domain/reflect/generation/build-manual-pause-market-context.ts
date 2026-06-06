import type { MarketQuote } from '@/features/market/public';
import {
  buildPauseContextFromMarket,
  isBitcoinTrackedAsset,
  normalizeTrackedAssetId,
  severityFromBtcChangePercent,
  trackedAssetSymbol,
} from '@/features/market/public';
import { buildSilentReflectionStubMessage } from '@/features/pause/domain/reflect/generation/build-silent-reflection-stub-message';

export type ManualPauseMarketContext = {
  assetId: string;
  ctx: string;
  severityBand: string;
  onChainBand: string | null;
  silentMsg: string;
};

/** Market snapshot → pause context string, severity band, and silent reflection stub copy. */
export function buildManualPauseMarketContext(
  data: MarketQuote,
  cumulativeThreshold: number,
  profileTrackedAssetId: string,
): ManualPauseMarketContext {
  const assetId = normalizeTrackedAssetId(profileTrackedAssetId);
  const assetSym = trackedAssetSymbol(assetId);
  const ctx = buildPauseContextFromMarket(data, cumulativeThreshold, assetSym);
  const severityBand = severityFromBtcChangePercent(data.changePercent) ?? 'mild';
  const onChainBand =
    isBitcoinTrackedAsset(assetId) && data.onChain
      ? ([data.onChain.mempoolSize, data.onChain.fastestFee, data.onChain.medianFee].filter(
          (x) => typeof x === 'number' && Number.isFinite(x),
        ) as number[]).join(':') || null
      : null;
  const silentMsg = buildSilentReflectionStubMessage(assetSym);

  return { assetId, ctx, severityBand, onChainBand, silentMsg };
}
