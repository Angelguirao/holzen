import {
  createContext,
  createElement,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getHolzenMarketDisplayQueryOptions,
  holzenMarketDisplayQueryKey,
} from '@/features/market/public';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import { useOpenPauseHomePreview } from '@/features/pause/public-hooks';
import {
  mapHolzenMarketDisplayError,
  normalizeTrackedAssetId,
  severityFromBtcChangePercent,
} from '@/features/market/public';
import { millisecondsUntilNextQuarterHour } from '@/screens/home/lib/next-cron-quarter';
import {
  useHolzenManualTriggerOrchestration,
  useManualPauseTrigger,
} from '@/features/pause/public-hooks';

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
    dismissOpenPauseHome: dismissMessage,
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

  const { manualTrigger, manualCooldownRemaining, autoCooldownRemaining } =
    useHolzenManualTriggerOrchestration({
      user,
      profileTrackedAssetId,
      currency,
      cooldownHours,
      lastTriggerAt,
      btcData: btcQuery.data,
      queryClient,
      generateMessage,
      setError,
    });

  const nextCronCheckIn = useCallback(() => millisecondsUntilNextQuarterHour(), []);

  const refreshProfile = useCallback(async () => {
    // No-op in V2; the realtime subscription on pause_instances handles
    // fresh pushes from cron. Retained for API parity with old callers.
    return;
  }, []);

  const btcData = btcQuery.data ?? null;

  const severity = severityFromBtcChangePercent(btcData?.changePercent);

  const marketFetchError = useMemo(
    () =>
      mapHolzenMarketDisplayError({
        profileLoaded,
        isError: btcQuery.isError,
        error: btcQuery.error,
      }),
    [profileLoaded, btcQuery.isError, btcQuery.error],
  );

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
