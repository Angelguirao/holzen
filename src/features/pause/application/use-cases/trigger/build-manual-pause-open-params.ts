import type { BtcPriceData } from '@/features/market/public';
import {
  buildPauseContextFromMarket,
  normalizeTrackedAssetId,
  severityFromBtcChangePercent,
  trackedAssetSymbol,
} from '@/features/market/public';
import type { OpenManualPauseFromHomeParams } from './open-manual-pause-from-home';

export type ManualPauseMarketContext = {
  assetId: string;
  ctx: string;
  severityBand: string;
  onChainBand: string | null;
  silentMsg: string;
};

/** Market snapshot → pause context string, severity band, and RPC payload fields. */
export function buildManualPauseMarketContext(
  data: BtcPriceData,
  cumulativeThreshold: number,
  profileTrackedAssetId: string,
): ManualPauseMarketContext {
  const assetId = normalizeTrackedAssetId(profileTrackedAssetId);
  const assetSym = trackedAssetSymbol(assetId);
  const ctx = buildPauseContextFromMarket(data, cumulativeThreshold, assetSym);
  const severityBand = severityFromBtcChangePercent(data.changePercent) ?? 'mild';
  const onChainBand =
    assetId === 'bitcoin' && data.onChain
      ? ([data.onChain.mempoolSize, data.onChain.fastestFee, data.onChain.medianFee].filter(
          (x) => typeof x === 'number' && Number.isFinite(x),
        ) as number[]).join(':') || null
      : null;
  const silentMsg = `${assetSym} moved.`;

  return { assetId, ctx, severityBand, onChainBand, silentMsg };
}

export type BuildManualPauseOpenParamsInput = {
  userId: string;
  silentMode: boolean;
  mood?: string;
  data: BtcPriceData;
  cumulativeThreshold: number;
  profileTrackedAssetId: string;
};

/** Full `openManualPauseFromHome` params from Home market data + profile. */
export function buildManualPauseOpenParams(
  input: BuildManualPauseOpenParamsInput,
): OpenManualPauseFromHomeParams & ManualPauseMarketContext {
  const { assetId, ctx, severityBand, onChainBand, silentMsg } = buildManualPauseMarketContext(
    input.data,
    input.cumulativeThreshold,
    input.profileTrackedAssetId,
  );

  return {
    assetId,
    ctx,
    severityBand,
    onChainBand,
    silentMsg,
    userId: input.userId,
    silentMode: input.silentMode,
    contextText: ctx,
    silentMessage: silentMsg,
    mood: input.mood,
    changePercent: input.data.changePercent,
    cumulativeChangePercent: input.data.cumulativeChangePercent ?? null,
    trackedAssetId: assetId,
    fearGreedLabel: input.data.fearGreed?.label ?? null,
    onChainBand,
  };
}
