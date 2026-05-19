import { bucketChangePercent, computeContextFingerprint } from '@/features/pause/domain/pause-fingerprint';
import { pauseCreateSkippedUserMessage } from '@/features/pause/application/use-cases/create-skipped-message';
import { reflectionPersistErrorMessage } from '@/features/pause/application/use-cases/reflection-persist-error';
import type { PauseCreateOrReuseResult } from '@/features/pause/domain/rpc-types';
const VOLATILITY_TEMPLATE = 'volatility_v1';

export type OpenManualPauseFromHomeParams = {
  userId: string;
  silentMode: boolean;
  contextText: string;
  silentMessage: string;
  mood?: string | null;
  changePercent: number;
  cumulativeChangePercent: number | null;
  trackedAssetId: string;
  severityBand: string;
  fearGreedLabel: string | null;
  onChainBand: string | null;
};

export type OpenManualPauseFromHomeSuccess = {
  outcome: 'opened';
  instanceId: string;
  context: string;
  pendingOffer: boolean;
  created: boolean;
  /** When true, caller should set Home message to `silentMessage`. */
  silentStubPersisted: boolean;
};

export type OpenManualPauseFromHomeIdle = {
  outcome: 'idle';
  userMessage: string;
};

export type OpenManualPauseFromHomeError = {
  outcome: 'error';
  userMessage: string;
  isNetwork: boolean;
};

export type OpenManualPauseFromHomeResult =
  | OpenManualPauseFromHomeSuccess
  | OpenManualPauseFromHomeIdle
  | OpenManualPauseFromHomeError;

export type OpenManualPauseFromHomePorts = {
  createOrReuse: (params: {
    templateSlug: string;
    source: string;
    contextSnapshot: Record<string, unknown>;
    contextRuleResult: Record<string, unknown>;
    contextFingerprint: string;
  }) => Promise<PauseCreateOrReuseResult>;
  persistReflectionArtifacts: (params: {
    pauseInstanceId: string;
    userId: string;
    context: string;
    message: string;
  }) => Promise<void>;
};

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
    const res = await ports.createOrReuse(createParams);
    if (!res.instance_id) {
      return { outcome: 'idle', userMessage: pauseCreateSkippedUserMessage(res.reused_reason) };
    }

    const pendingOffer = res.pending_offer === true;

    if (params.silentMode) {
      try {
        await ports.persistReflectionArtifacts({
          pauseInstanceId: res.instance_id,
          userId: params.userId,
          context: params.contextText,
          message: params.silentMessage,
        });
      } catch (e: unknown) {
        return {
          outcome: 'error',
          userMessage: reflectionPersistErrorMessage(e),
          isNetwork: false,
        };
      }
      return {
        outcome: 'opened',
        instanceId: res.instance_id,
        context: params.contextText,
        pendingOffer,
        created: res.created,
        silentStubPersisted: true,
      };
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
