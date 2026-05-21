import { bucketChangePercent, computeContextFingerprint } from '@/features/pause/domain/pause-fingerprint';
import { pauseCreateSkippedUserMessage } from '@/features/pause/application/use-cases/ritual/reflect/generation/pause-create-skipped-user-message';
import { runPauseCreateOrReuse } from '@/features/pause/application/use-cases/session/run-pause-create-or-reuse';
import { runOpenManualPauseSilentModeAfterCreate } from '@/features/pause/application/use-cases/ritual/reflect/generation/run-open-manual-pause-silent-mode-after-create';
import type {
  OpenManualPauseFromHomeError,
  OpenManualPauseFromHomeParams,
  OpenManualPauseFromHomePorts,
  OpenManualPauseFromHomeResult,
} from './open-manual-pause-from-home-types';

export type {
  OpenManualPauseFromHomeError,
  OpenManualPauseFromHomeIdle,
  OpenManualPauseFromHomeParams,
  OpenManualPauseFromHomePorts,
  OpenManualPauseFromHomeResult,
  OpenManualPauseFromHomeSuccess,
} from './open-manual-pause-from-home-types';

const VOLATILITY_TEMPLATE = 'volatility_v1';

function mapCreateOrReuseError(e: unknown): OpenManualPauseFromHomeError {
  const raw = e instanceof Error ? e.message : String(e);
  if (raw.includes('fetch') || raw.includes('network') || raw.includes('Failed to fetch')) {
    return {
      outcome: 'error',
      userMessage: 'Could not reach Holzen. Check your connection.',
      isNetwork: true,
    };
  }
  return {
    outcome: 'error',
    userMessage: 'Could not open a pause right now. Try again shortly.',
    isNetwork: false,
  };
}

/** Home "Need a moment": `pause_create_or_reuse` (+ silent reflection stub when enabled). */
export async function openManualPauseFromHome(
  ports: OpenManualPauseFromHomePorts,
  params: OpenManualPauseFromHomeParams,
): Promise<OpenManualPauseFromHomeResult> {
  const directionBucket = params.changePercent < 0 ? 'down' : 'up';
  const contextFingerprint = await computeContextFingerprint({
    templateSlug: VOLATILITY_TEMPLATE,
    directionBucket,
    severityBand: params.severityBand,
    dailyBucketPct: bucketChangePercent(params.changePercent),
    cumulativeBucketPct: bucketChangePercent(params.cumulativeChangePercent ?? 0),
    trackedAssetId: params.trackedAssetId,
    fearGreedBand: params.fearGreedLabel,
    onChainBand: params.onChainBand,
  });

  const createParams = {
    templateSlug: VOLATILITY_TEMPLATE,
    source: 'manual' as const,
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

  try {
    const res = await runPauseCreateOrReuse(ports.repository, createParams);
    if (!res.instance_id) {
      return { outcome: 'idle', userMessage: pauseCreateSkippedUserMessage(res.reused_reason) };
    }

    const pendingOffer = res.pending_offer === true;

    if (params.silentMode) {
      return runOpenManualPauseSilentModeAfterCreate(ports.reflect, {
        pauseInstanceId: res.instance_id,
        userId: params.userId,
        contextText: params.contextText,
        silentMessage: params.silentMessage,
        pendingOffer,
        created: res.created,
      });
    }

    return {
      outcome: 'opened',
      instanceId: res.instance_id,
      context: params.contextText,
      pendingOffer,
      created: res.created,
      silentStubPersisted: false,
    };
  } catch (e: unknown) {
    return mapCreateOrReuseError(e);
  }
}
