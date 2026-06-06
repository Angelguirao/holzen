import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getHolzenMarketDisplayQueryOptions,
  mapHolzenMarketDisplayError,
  severityFromMarketChangePercent,
} from '@/features/market/public';
import { resolveHomeMarketDisplayQuote } from '@/features/market/domain/home-market-display-quote';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import { millisecondsUntilNextVolatilityCheck } from '@/features/pause/public-scheduling';
import { useOpenPauseHomePreview } from '@/features/pause/presentation/reflect/generation/manual-open/use-open-pause-home-preview';
import { useHolzenManualTriggerOrchestration } from './use-holzen-manual-trigger-orchestration';
import { useManualPauseTrigger } from '@/features/pause/presentation/reflect/generation/manual-open/use-manual-pause-trigger';
import type { PauseHomeContextValue } from '@/features/pause/domain/home/pause-home-context-value';

/**
 * Shared Home + `/pause` context: market display, open-pause preview, manual trigger.
 * Profile fields: `useProfile` from `@/features/user/public-hooks`.
 * Mounted from `PauseHomeProvider` (`public-home`) when the user is signed in.
 */
export function useHolzenHomeContextState(): PauseHomeContextValue {
  const { user } = useAuth();
  const profile = useProfile();
  const queryClient = useQueryClient();

  const {
    silentMode,
    currency,
    trackedAssetId: profileTrackedAssetId,
    cooldownHours,
    profileLoaded,
    lastTriggerAt: profileLastTriggerAt,
  } = profile;

  const marketQuery = useQuery(
    getHolzenMarketDisplayQueryOptions({
      coinIdRaw: profileTrackedAssetId,
      currency,
      enabled: profileLoaded,
    }),
  );

  const [error, setError] = useState<string | null>(null);
  /** True briefly after a new pause message is shown — Home uses it for one-shot chime. */
  const [newPauseArrival, setNewPauseArrival] = useState(false);

  const {
    message,
    context,
    companions,
    lastPauseInstanceId,
    openPauseState,
    openPauseSource,
    contextSnapshot,
    hasReflectionStep,
    hasOpenPauseStepEvents,
    hasReachedReflect,
    isBriefRitual,
    openPauseCreatedAt,
    setMessage,
    setContext,
    setCompanions,
    setLastPauseInstanceId,
    setOpenPauseState,
    dismissOpenPauseHome: dismissMessage,
    syncOpenPauseFromDb,
  } = useOpenPauseHomePreview(user, {
    onOpenPauseInstanceChanged: () => setNewPauseArrival(true),
  });

  const { generateMessage, loading } = useManualPauseTrigger({
    user,
    silentMode,
    trackedAssetId: profile.trackedAssetId,
    syncOpenPauseFromDb,
    setError,
    setMessage,
    setContext,
    setCompanions,
    setNewPauseArrival,
    setLastPauseInstanceId,
  });

  const { manualTrigger, manualCooldownRemaining, autoCooldownRemaining } =
    useHolzenManualTriggerOrchestration({
      user,
      profileTrackedAssetId,
      currency,
      cooldownHours,
      lastTriggerAt: profileLastTriggerAt,
      queryClient,
      generateMessage,
      setError,
    });

  const nextCronCheckIn = useCallback(() => millisecondsUntilNextVolatilityCheck(), []);

  const marketData = useMemo(() => {
    const live = marketQuery.data ?? null;
    try {
      return resolveHomeMarketDisplayQuote({
        marketData: live,
        openPauseSource,
        openPauseState,
        openPauseContextSnapshot: contextSnapshot,
      });
    } catch (err) {
      console.error('[useHolzenHomeContextState] market display projection failed', err);
      return live;
    }
  }, [marketQuery.data, openPauseSource, openPauseState, contextSnapshot]);

  const severity = severityFromMarketChangePercent(marketData?.changePercent);

  const marketFetchError = useMemo(
    () =>
      mapHolzenMarketDisplayError({
        profileLoaded,
        isError: marketQuery.isError,
        error: marketQuery.error,
      }),
    [profileLoaded, marketQuery.isError, marketQuery.error],
  );

  return {
    marketData,
    btcData: marketData,
    message,
    context,
    companions,
    severity,
    lastPauseInstanceId,
    openPauseState,
    openPauseSource,
    contextSnapshot,
    hasReflectionStep,
    hasOpenPauseStepEvents,
    hasReachedReflect,
    isBriefRitual,
    openPauseCreatedAt,
    loading,
    error: error ?? marketFetchError,
    newPauseArrival,
    clearNewPauseArrival: () => setNewPauseArrival(false),
    dismissMessage,
    manualTrigger,
    manualCooldownRemaining,
    autoCooldownRemaining,
    nextCronCheckIn,
    resyncOpenPauseFromDb: syncOpenPauseFromDb,
  };
}
