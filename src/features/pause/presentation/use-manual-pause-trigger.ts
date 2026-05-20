import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { BtcPriceData } from '@/features/market/public';
import {
  buildPauseContextFromMarket,
  normalizeTrackedAssetId,
  severityFromBtcChangePercent,
  trackedAssetSymbol,
} from '@/features/market/public';
import { clearSession } from '@/features/pause/public';
import {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type CompanionData,
  type ManualPauseTriggerResult,
} from '@/features/pause/public';
import { openManualPauseFromHome } from '@/features/pause/public-rpc';
import type { OpenManualPauseFromHomeResult } from '@/features/pause/public-rpc';
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

      const applyOpenResult = async (
        result: OpenManualPauseFromHomeResult,
      ): Promise<ManualPauseTriggerResult> => {
        if (result.outcome === 'idle') {
          setError(result.userMessage);
          return MANUAL_PAUSE_TRIGGER_IDLE;
        }
        if (result.outcome === 'error') {
          holzenLog.manual('generateMessage: error', { message: result.userMessage });
          setError(result.userMessage);
          return MANUAL_PAUSE_TRIGGER_IDLE;
        }

        const isPendingOffer = result.pendingOffer;
        if (!isPendingOffer) {
          clearSession();
          setLastPauseInstanceId(result.instanceId);
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
          setMessage(result.silentStubPersisted ? silentMsg : null);
          setContext(ctx);
          setCompanions({ haiku: null, groundingTitle: null, groundingBody: null });
          setNewPauseArrival(true);
          setLastTriggerAt(new Date().toISOString());
          try {
            trackEvent('pause.manual_completed', {
              duration_s: Math.round((Date.now() - t0) / 1000),
              had_bitcoin_context: assetId === 'bitcoin',
              tracked_asset_id: assetId,
              companion_types: [],
            });
          } catch {
            /* no-op */
          }
          await syncOpenPauseFromDb();
        }
        return {
          opened: true,
          instanceId: result.instanceId,
          context: ctx,
          pendingOffer: isPendingOffer || undefined,
        };
      };

      const openParams = {
        userId: user.id,
        silentMode,
        contextText: ctx,
        silentMessage: silentMsg,
        mood,
        changePercent: data.changePercent,
        cumulativeChangePercent: data.cumulativeChangePercent ?? null,
        trackedAssetId: assetId,
        severityBand,
        fearGreedLabel: data.fearGreed?.label ?? null,
        onChainBand,
      };

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
