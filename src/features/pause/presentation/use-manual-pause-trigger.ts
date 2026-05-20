import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { BtcPriceData } from '@/features/market/public';
import { applyManualPauseOpenResult } from '@/features/pause/application/use-cases/trigger/apply-manual-pause-open-result';
import { buildManualPauseOpenParams } from '@/features/pause/application/use-cases/trigger/build-manual-pause-open-params';
import { clearSession } from '@/features/pause/public';
import {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type CompanionData,
  type ManualPauseTriggerResult,
} from '@/features/pause/public';
import { openManualPauseFromHome } from '@/features/pause/public-rpc';
import { holzenLog } from '@/lib/holzen-console';
import { trackEvent } from '@/lib/posthog';

const PAUSE_MANUAL_START_HOME = 'holzen_sess_pause_manual_started_home';

/** Once per tab session: user kicked off a manual “Need a moment” (opens pause instance) from Home. */
function markPauseManualStartedHomeOnce(): void {
  try {
    if (sessionStorage.getItem(PAUSE_MANUAL_START_HOME)) return;
    sessionStorage.setItem(PAUSE_MANUAL_START_HOME, '1');
    trackEvent('pause.manual_started', { surface: 'home' });
  } catch {
    /* sessionStorage */
  }
}

export interface UseManualPauseTriggerParams {
  user: User | null;
  silentMode: boolean;
  cumulativeThreshold: number;
  trackedAssetId: string;
  syncOpenPauseFromDb: () => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
  setContext: Dispatch<SetStateAction<string | null>>;
  setCompanions: Dispatch<SetStateAction<CompanionData>>;
  setNewPauseArrival: Dispatch<SetStateAction<boolean>>;
  setLastPauseInstanceId: Dispatch<SetStateAction<string | null>>;
  setLastTriggerAt: Dispatch<SetStateAction<string | null>>;
}

/**
 * Home manual “Need a moment”: market context → `openManualPauseFromHome` → Home preview state.
 * Called from `useHolzen` in screens; RPC authority stays in `openManualPauseFromHome` use case.
 */
export function useManualPauseTrigger({
  user,
  silentMode,
  cumulativeThreshold,
  trackedAssetId: profileTrackedAssetId,
  syncOpenPauseFromDb,
  setError,
  setLoading,
  setMessage,
  setContext,
  setCompanions,
  setNewPauseArrival,
  setLastPauseInstanceId,
  setLastTriggerAt,
}: UseManualPauseTriggerParams) {
  const generateMessage = useCallback(
    async (data: BtcPriceData, mood?: string): Promise<ManualPauseTriggerResult> => {
      if (!user) {
        holzenLog.manual('generateMessage: skipped (no user)');
        return MANUAL_PAUSE_TRIGGER_IDLE;
      }
      markPauseManualStartedHomeOnce();
      const t0 = Date.now();
      holzenLog.manual('generateMessage: start', {
        btcChangePct: data.changePercent,
        silentMode,
        mood: mood ?? '(none)',
      });

      const { assetId, ctx, severityBand, silentMsg, ...openParams } = buildManualPauseOpenParams({
        userId: user.id,
        silentMode,
        mood,
        data,
        cumulativeThreshold,
        profileTrackedAssetId,
      });

      const previewPorts = {
        setError,
        clearPauseSession: clearSession,
        setLastPauseInstanceId,
        setMessage,
        setContext,
        setCompanionsEmpty: () =>
          setCompanions({ haiku: null, groundingTitle: null, groundingBody: null }),
        setNewPauseArrival,
        setLastTriggerAt,
        syncOpenPauseFromDb,
      };

      const applyOpenResult = (result: Parameters<typeof applyManualPauseOpenResult>[0]['result']) =>
        applyManualPauseOpenResult(
          { result, ctx, silentMsg, assetId, severityBand, startedAtMs: t0 },
          previewPorts,
        );

      if (silentMode) {
        holzenLog.manual('generateMessage: silent mode');
        const result = await openManualPauseFromHome(openParams);
        if (result.outcome === 'error') {
          holzenLog.manual('generateMessage: silent pause create failed', {
            message: result.userMessage,
          });
        }
        return applyOpenResult(result);
      }

      setLoading(true);
      setError(null);
      try {
        const result = await openManualPauseFromHome(openParams);
        if (result.outcome === 'idle') {
          holzenLog.manual('generateMessage: reuse/skip');
        }
        return applyOpenResult(result);
      } finally {
        setLoading(false);
      }
    },
    [
      user,
      silentMode,
      cumulativeThreshold,
      profileTrackedAssetId,
      syncOpenPauseFromDb,
      setError,
      setLoading,
      setMessage,
      setContext,
      setCompanions,
      setNewPauseArrival,
      setLastPauseInstanceId,
      setLastTriggerAt,
    ],
  );

  return { generateMessage };
}
