import {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type ManualPauseTriggerResult,
} from '@/features/pause/domain/manual-pause-trigger-result';
import {
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  type TrackManualPauseInstanceCreatedPayload,
  type TrackPauseManualCompletedPayload,
} from '@/features/pause/application/use-cases/trigger/manual-pause-trigger-telemetry';
import type { OpenManualPauseFromHomeResult } from '@/features/pause/application/use-cases/ritual/reflect/generation/open-manual-pause-from-home-types';

export type ManualPauseHomePreviewPorts = {
  setError: (message: string | null) => void;
  clearPauseSession: () => void;
  setLastPauseInstanceId: (id: string | null) => void;
  setMessage: (message: string | null) => void;
  setContext: (context: string | null) => void;
  setCompanionsEmpty: () => void;
  setNewPauseArrival: (value: boolean) => void;
  setLastTriggerAt: (iso: string) => void;
  syncOpenPauseFromDb: () => Promise<void>;
  /** PostHog — wired from `public-rpc` in Home presentation; defaults for unit tests. */
  trackInstanceCreated?: (payload: TrackManualPauseInstanceCreatedPayload) => void;
  trackManualCompleted?: (payload: TrackPauseManualCompletedPayload) => void;
};

export type ApplyManualPauseOpenResultInput = {
  result: OpenManualPauseFromHomeResult;
  ctx: string;
  silentMsg: string;
  assetId: string;
  severityBand: string;
  startedAtMs: number;
};

/** Maps `openManualPauseFromHome` outcome to Home preview state + analytics. */
export async function applyManualPauseOpenResult(
  input: ApplyManualPauseOpenResultInput,
  ports: ManualPauseHomePreviewPorts,
): Promise<ManualPauseTriggerResult> {
  const { result, ctx, silentMsg, assetId, severityBand, startedAtMs } = input;
  const trackCreated = ports.trackInstanceCreated ?? trackManualPauseInstanceCreated;
  const trackCompleted = ports.trackManualCompleted ?? trackPauseManualCompleted;

  if (result.outcome === 'idle') {
    ports.setError(result.userMessage);
    return MANUAL_PAUSE_TRIGGER_IDLE;
  }
  if (result.outcome === 'error') {
    ports.setError(result.userMessage);
    return MANUAL_PAUSE_TRIGGER_IDLE;
  }

  const isPendingOffer = result.pendingOffer;
  if (!isPendingOffer) {
    ports.clearPauseSession();
    ports.setLastPauseInstanceId(result.instanceId);
  }
  if (result.created) {
    trackCreated({
      pauseInstanceId: result.instanceId,
      severity: severityBand,
      pendingOffer: isPendingOffer,
    });
  }
  if (!isPendingOffer) {
    ports.setMessage(result.silentStubPersisted ? silentMsg : null);
    ports.setContext(ctx);
    ports.setCompanionsEmpty();
    ports.setNewPauseArrival(true);
    ports.setLastTriggerAt(new Date().toISOString());
    trackCompleted({
      durationS: Math.round((Date.now() - startedAtMs) / 1000),
      hadBitcoinContext: assetId === 'bitcoin',
      trackedAssetId: assetId,
    });
    await ports.syncOpenPauseFromDb();
  }
  return {
    opened: true,
    instanceId: result.instanceId,
    context: ctx,
    pendingOffer: isPendingOffer || undefined,
  };
}
