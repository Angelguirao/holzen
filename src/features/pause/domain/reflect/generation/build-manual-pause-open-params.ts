import type { BtcPriceData } from '@/features/market/public';
import {
  buildManualPauseMarketContext,
  type ManualPauseMarketContext,
} from '@/features/pause/domain/reflect/generation/build-manual-pause-market-context';
import type { OpenManualPauseFromHomeParams } from '@/features/pause/domain/reflect/generation/open-manual-pause-from-home-params';

export type { ManualPauseMarketContext };

/** Full `openManualPauseFromHome` params from Home market data + profile. */
export type BuildManualPauseOpenParamsInput = {
  userId: string;
  silentMode: boolean;
  mood?: string;
  data: BtcPriceData;
  cumulativeThreshold: number;
  profileTrackedAssetId: string;
};

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
