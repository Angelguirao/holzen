import { bucketChangePercent, computeContextFingerprint } from '@/features/pause/domain/pause-fingerprint';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import type { OpenManualPauseFromHomeParams } from './open-manual-pause-from-home-types';

export const MANUAL_PAUSE_VOLATILITY_TEMPLATE = 'volatility_v1';

export type ManualPauseCreateOrReuseParams = Parameters<PauseRepository['createOrReuse']>[0];

/** Shape `pause_create_or_reuse` input from Home manual-open market params + context fingerprint. */
export async function buildManualPauseCreateOrReuseParams(
  params: OpenManualPauseFromHomeParams,
): Promise<ManualPauseCreateOrReuseParams> {
  const directionBucket = params.changePercent < 0 ? 'down' : 'up';
  const contextFingerprint = await computeContextFingerprint({
    templateSlug: MANUAL_PAUSE_VOLATILITY_TEMPLATE,
    directionBucket,
    severityBand: params.severityBand,
    dailyBucketPct: bucketChangePercent(params.changePercent),
    cumulativeBucketPct: bucketChangePercent(params.cumulativeChangePercent ?? 0),
    trackedAssetId: params.trackedAssetId,
    fearGreedBand: params.fearGreedLabel,
    onChainBand: params.onChainBand,
  });

  return {
    templateSlug: MANUAL_PAUSE_VOLATILITY_TEMPLATE,
    source: 'manual',
    contextSnapshot: {
      change_24h_pct: params.changePercent,
      change_7d_pct: params.cumulativeChangePercent ?? null,
      direction: directionBucket,
      severity: params.severityBand,
      context_text: params.contextText,
      last_reported_mood: params.mood ?? null,
      tracked_asset_id: params.trackedAssetId,
    },
    contextRuleResult: { triggered: ['manual'] as const },
    contextFingerprint,
  };
}
