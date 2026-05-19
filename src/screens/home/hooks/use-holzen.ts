import {
  createContext,
  createElement,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getHolzenMarketDisplayQueryOptions,
  holzenMarketDisplayQueryKey,
} from '@/features/market/public';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import { holzenLog } from '@/lib/holzen-console';
import { clearSession } from '@/features/pause/public';
import { useOpenPauseHomePreview } from '@/screens/home/hooks/use-open-pause-home-preview';
import {
  getManualReflectionCooldownMs,
  isHolzenDevMode,
} from '@/features/market/public';
import { normalizeTrackedAssetId } from '@/features/market/public';
import { severityFromBtcChangePercent } from '@/features/market/public';
import { millisecondsUntilNextQuarterHour } from '@/screens/home/lib/next-cron-quarter';
import {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type ManualPauseTriggerResult,
} from '@/features/pause/public';
import { useManualPauseTrigger } from '@/screens/home/hooks/use-manual-pause-trigger';

export { holzenMarketDisplayQueryKey };

/**
 * Pause V2 manual-trigger hook. Opens a `pause_instances` row via `pause_create_or_reuse`
 * (+ context snapshot). Non-silent reflection text is generated later in the deep ritual via
 * `holzen-reflect` (`PauseSession` + `use-pause-reflect-generation`, enabled on Reflect, Frame,
 * second Breathe, and Decide). Silent mode still writes a stub `reflection_text` artifact here.
 */
export type HolzenContextValue = ReturnType<typeof useHolzenState>;

const HolzenContext = createContext<HolzenContextValue | null>(null);

/** One shared pause/profile/market tree for the signed-in session (survives tab switches). */
export function HolzenProvider({ children }: { children: ReactNode }) {
  const value = useHolzenState();
  return createElement(HolzenContext.Provider, { value }, children);
}

export function useHolzen(): HolzenContextValue {
  const ctx = useContext(HolzenContext);
  if (!ctx) {
    throw new Error('useHolzen must be used within HolzenProvider');
  }
  return ctx;
}

function useHolzenState() {
  const { user } = useAuth();
  const profile = useProfile();
  const queryClient = useQueryClient();

  const {
    reflectionTone,
    reflectionStyle,
    silentMode,
    customPrompt,
    motivations,
    mantra,
    groundingActivities,
    currency,
    trackedAssetId: profileTrackedAssetId,
    language,
    cooldownHours,
    profileLoaded,
  } = profile;

  const btcQuery = useQuery(
    getHolzenMarketDisplayQueryOptions({
      coinIdRaw: profileTrackedAssetId,
      currency,
      enabled: profileLoaded,
    }),
  );

  const {
    message,
    context,
    companions,
    lastPauseInstanceId,
    openPauseState,
    lastTriggerAt,
    setMessage,
    setContext,
    setCompanions,
    setLastPauseInstanceId,
    setOpenPauseState,
    setLastTriggerAt,
    syncOpenPauseFromDb,
  } = useOpenPauseHomePreview(user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** True briefly after a new pause message is shown — Home uses it for one-shot chime. */
  const [newPauseArrival, setNewPauseArrival] = useState(false);

  const { generateMessage } = useManualPauseTrigger({
    user,
    silentMode,
    cumulativeThreshold: profile.cumulativeThreshold,
    trackedAssetId: profile.trackedAssetId,
    syncOpenPauseFromDb,
    setError,
    setLoading,
    setMessage,
    setContext,
    setCompanions,
    setNewPauseArrival,
    setLastPauseInstanceId,
    setLastTriggerAt,
  });

  const manualCooldownKey = user ? `holzen_last_manual_at_${user.id}` : 'holzen_last_manual_at';
  const [lastManualAt, setLastManualAt] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(manualCooldownKey);
    setLastManualAt(stored ? Number(stored) : null);
  }, [manualCooldownKey]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== manualCooldownKey || e.storageArea !== localStorage) return;
      setLastManualAt(e.newValue ? Number(e.newValue) : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [manualCooldownKey]);

  const manualCooldownRemaining = useCallback(() => {
    if (!lastManualAt) return 0;
    const elapsed = Date.now() - lastManualAt;
    return Math.max(0, getManualReflectionCooldownMs() - elapsed);
  }, [lastManualAt]);

  const autoCooldownRemaining = useCallback(() => {
    if (!lastTriggerAt) return 0;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(lastTriggerAt).getTime();
    return Math.max(0, cooldownMs - elapsed);
  }, [lastTriggerAt, cooldownHours]);

  const nextCronCheckIn = useCallback(() => millisecondsUntilNextQuarterHour(), []);

  const manualTrigger = useCallback(
    async (mood?: string): Promise<ManualPauseTriggerResult> => {
      const remaining = manualCooldownRemaining();
      if (remaining > 0) {
        holzenLog.manual('manualTrigger: blocked by cooldown', {
          remainingMs: remaining,
          devMode: isHolzenDevMode(),
        });
        return MANUAL_PAUSE_TRIGGER_IDLE;
      }

      try {
        const marketOpts = getHolzenMarketDisplayQueryOptions({
          coinIdRaw: profileTrackedAssetId,
          currency,
          enabled: true,
        });
        const data =
          btcQuery.data ??
          (await queryClient.fetchQuery({
            queryKey: marketOpts.queryKey,
            queryFn: marketOpts.queryFn,
          }));
        const result = await generateMessage(data, mood);
        if (result.opened) {
          const now = Date.now();
          setLastManualAt(now);
          localStorage.setItem(manualCooldownKey, String(now));
        }
        return result;
      } catch (e: unknown) {
        const raw = e instanceof Error ? e.message : String(e);
        if (raw.includes('fetch') || raw.includes('Failed to fetch')) {
          setError('Could not connect. Check your internet and try again.');
        } else {
          setError('Could not start a pause right now. Try again in a moment.');
        }
        return MANUAL_PAUSE_TRIGGER_IDLE;
      }
    },
    [btcQuery.data, generateMessage, manualCooldownRemaining, currency, manualCooldownKey, profileTrackedAssetId, queryClient],
  );

  const dismissMessage = useCallback(async () => {
    clearSession();
    setMessage(null);
    setContext(null);
    setCompanions({ haiku: null, groundingTitle: null, groundingBody: null });
    setLastPauseInstanceId(null);
    setOpenPauseState(null);
    if (!user) return;
    try {
      await supabase.rpc('pause_dismiss_current' as never);
    } catch {
      /* non-fatal */
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    // No-op in V2; the realtime subscription on pause_instances handles
    // fresh pushes from cron. Retained for API parity with old callers.
    return;
  }, []);

  const btcData = btcQuery.data ?? null;

  const severity = severityFromBtcChangePercent(btcData?.changePercent);

  const marketFetchError = useMemo(() => {
    if (!profileLoaded || !btcQuery.isError || !btcQuery.error) return null;
    const raw = btcQuery.error instanceof Error ? btcQuery.error.message : String(btcQuery.error);
    if (raw.includes('fetch') || raw.includes('Failed to fetch')) {
      return 'Price data unavailable. CoinGecko may be down — retrying shortly.';
    }
    return 'Could not check market data. Will retry automatically.';
  }, [profileLoaded, btcQuery.isError, btcQuery.error]);

  return {
    ...profile,
    /** CoinGecko id allowlist — normalized so consumers see `TrackedAssetId`, not raw profile strings. */
    trackedAssetId: normalizeTrackedAssetId(profile.trackedAssetId),
    setCurrency: async (val: string) => {
      await profile.setCurrency(val);
    },
    setTrackedAssetId: async (val: string) => {
      await profile.setTrackedAssetId(val);
    },
    btcData,
    message,
    context,
    companions,
    severity,
    lastPauseInstanceId,
    openPauseState,
    loading,
    error: error ?? marketFetchError,
    newPauseArrival,
    clearNewPauseArrival: () => setNewPauseArrival(false),
    dismissMessage,
    manualTrigger,
    manualCooldownRemaining,
    autoCooldownRemaining,
    nextCronCheckIn,
    profileLoaded,
    refreshProfile,
    /** After `pause_adopt_pending_offer`, refresh Home open-pause preview from `v_pause_current`. */
    resyncOpenPauseFromDb: syncOpenPauseFromDb,
  };
}
