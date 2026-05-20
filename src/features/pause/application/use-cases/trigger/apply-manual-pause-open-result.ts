import {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type ManualPauseTriggerResult,
} from '@/features/pause/domain/manual-pause-trigger-result';
import {
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
} from './manual-pause-trigger-telemetry';
import type { OpenManualPauseFromHomeResult } from './open-manual-pause-from-home';

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
    trackManualPauseInstanceCreated({
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
    trackPauseManualCompleted({
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
