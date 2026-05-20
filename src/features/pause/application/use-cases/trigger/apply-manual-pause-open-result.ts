import {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type ManualPauseTriggerResult,
} from '@/features/pause/domain/manual-pause-trigger-result';
import { trackEvent } from '@/lib/posthog';
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
    try {
      trackEvent('pause_instance_created', {
        pause_instance_id: result.instanceId,
        template_slug: 'volatility_v1',
        source: 'manual',
        severity: severityBand,
        pending_offer: isPendingOffer,
      });
    } catch {
      /* no-op */
    }
  }
  if (!isPendingOffer) {
    ports.setMessage(result.silentStubPersisted ? silentMsg : null);
    ports.setContext(ctx);
    ports.setCompanionsEmpty();
    ports.setNewPauseArrival(true);
    ports.setLastTriggerAt(new Date().toISOString());
    try {
      trackEvent('pause.manual_completed', {
        duration_s: Math.round((Date.now() - startedAtMs) / 1000),
        had_bitcoin_context: assetId === 'bitcoin',
        tracked_asset_id: assetId,
        companion_types: [],
      });
    } catch {
      /* no-op */
    }
    await ports.syncOpenPauseFromDb();
  }
  return {
    opened: true,
    instanceId: result.instanceId,
    context: ctx,
    pendingOffer: isPendingOffer || undefined,
  };
}
