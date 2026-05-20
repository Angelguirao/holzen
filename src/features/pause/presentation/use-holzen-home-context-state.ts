import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getHolzenMarketDisplayQueryOptions,
  mapHolzenMarketDisplayError,
  normalizeTrackedAssetId,
  severityFromBtcChangePercent,
} from '@/features/market/public';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import { millisecondsUntilNextQuarterHour } from '@/features/pause/public';
import { useOpenPauseHomePreview } from './use-open-pause-home-preview';
import { useHolzenManualTriggerOrchestration } from './use-holzen-manual-trigger-orchestration';
import { useManualPauseTrigger } from './use-manual-pause-trigger';

/**
 * Shared Home + `/pause` context: profile, market display, open-pause preview, manual trigger.
 * Mounted from `HolzenProvider` in the app shell when the user is signed in.
 */
export function useHolzenHomeContextState() {
  const { user } = useAuth();
  const profile = useProfile();
  const queryClient = useQueryClient();

  const {
    silentMode,
    currency,
    trackedAssetId: profileTrackedAssetId,
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
