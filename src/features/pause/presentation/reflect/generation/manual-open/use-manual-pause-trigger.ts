import { useCallback, useTransition, type Dispatch, type SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { MarketQuote } from '@/features/market/public';
import type { ManualPauseTriggerOptions } from '@/features/pause/domain/manual-pause-trigger-options';
import {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type ManualPauseTriggerResult,
} from '@/features/pause/domain/manual-pause-trigger-result';
import type { CompanionData } from '@/features/pause/domain/companion-card-types';
import {
  applyManualPauseOpenResult,
  buildManualPauseOpenParams,
  openManualPauseFromHome,
  pauseHomeManualOpenPorts,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
import {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
} from './pause-home-reflect-telemetry-io';
import { clearPausePersistedTabSession } from '@/features/pause/presentation/session/pause-persisted-tab-session-io';
import { holzenLog } from '@/lib/holzen-console';

export interface UseManualPauseTriggerParams {
  user: User | null;
  silentMode: boolean;
  trackedAssetId: string;
  syncOpenPauseFromDb: () => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
  setContext: Dispatch<SetStateAction<string | null>>;
  setCompanions: Dispatch<SetStateAction<CompanionData>>;
  setNewPauseArrival: Dispatch<SetStateAction<boolean>>;
  setLastPauseInstanceId: Dispatch<SetStateAction<string | null>>;
  setLastTriggerAt: Dispatch<SetStateAction<string | null>>;
}

/**
 * Home manual “Need a moment”: market context → `openManualPauseFromHome` → Home preview state.
 * Called from `useHolzen` in screens; RPC + reflect I/O via `openManualPauseFromHome` + default port adapters.
 */
export function useManualPauseTrigger({
  user,
  silentMode,
  trackedAssetId: profileTrackedAssetId,
  syncOpenPauseFromDb,
  setError,
  setMessage,
  setContext,
  setCompanions,
  setNewPauseArrival,
  setLastPauseInstanceId,
  setLastTriggerAt,
}: UseManualPauseTriggerParams) {
  const [isPending, startTransition] = useTransition();

  const generateMessage = useCallback(
    async (
      data: MarketQuote,
      mood?: string,
      options?: ManualPauseTriggerOptions,
    ): Promise<ManualPauseTriggerResult> => {
      if (!user) {
        holzenLog.manual('generateMessage: skipped (no user)');
        return MANUAL_PAUSE_TRIGGER_IDLE;
      }
      markPauseManualStartedHomeOnce();
      const t0 = Date.now();
      holzenLog.manual('generateMessage: start', {
        marketChangePct: data.changePercent,
        silentMode,
        mood: mood ?? '(none)',
      });

      const built = buildManualPauseOpenParams({
        userId: user.id,
        silentMode,
        mood,
        data,
        profileTrackedAssetId,
      });
      const { assetId, ctx, silentMsg, ...openParams } = built;
      const { severityBand } = built;

      const previewPorts = {
        setError,
        clearPauseSession: () => clearPausePersistedTabSession(),
        setLastPauseInstanceId,
        setMessage,
        setContext,
        setCompanionsEmpty: () =>
          setCompanions({ haiku: null }),
        setNewPauseArrival,
        setLastTriggerAt,
        syncOpenPauseFromDb,
        trackInstanceCreated: trackManualPauseInstanceCreated,
        trackManualCompleted: trackPauseManualCompleted,
      };

      const applyOpenResult = (result: Parameters<typeof applyManualPauseOpenResult>[0]['result']) =>
        applyManualPauseOpenResult(
          {
            result,
            ctx,
            silentMsg,
            assetId,
            severityBand,
            startedAtMs: t0,
            skipHomePreview: options?.skipHomePreview,
          },
          previewPorts,
        );

      if (silentMode) {
        holzenLog.manual('generateMessage: silent mode');
        const result = await openManualPauseFromHome(pauseHomeManualOpenPorts, openParams);
        if (result.outcome === 'error') {
          holzenLog.manual('generateMessage: silent pause create failed', {
            message: result.userMessage,
          });
        }
        return applyOpenResult(result);
      }

      return new Promise<ManualPauseTriggerResult>((resolve) => {
        startTransition(async () => {
          setError(null);
          try {
            const result = await openManualPauseFromHome(pauseHomeManualOpenPorts, openParams);
            if (result.outcome === 'idle') {
              holzenLog.manual('generateMessage: reuse/skip');
            }
            resolve(applyOpenResult(result));
          } catch (e) {
            holzenLog.manual('generateMessage: unexpected error', { error: String(e) });
            resolve(MANUAL_PAUSE_TRIGGER_IDLE);
          }
        });
      });
    },
    [
      user,
      silentMode,
      profileTrackedAssetId,
      syncOpenPauseFromDb,
      setError,
      setMessage,
      setContext,
      setCompanions,
      setNewPauseArrival,
      setLastPauseInstanceId,
      setLastTriggerAt,
      startTransition,
    ],
  );

  return { generateMessage, loading: isPending };
}
