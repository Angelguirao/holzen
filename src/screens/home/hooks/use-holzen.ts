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
  type BtcPriceData,
} from '@/features/market/public';
import { supabase } from '@/integrations/supabase/client';
import { fetchOpenPauseHomePreview } from '@/features/pause/public-queries';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import type { CompanionData } from '@/screens/pause/components/CompanionSection';
import { holzenLog } from '@/lib/holzen-console';
import { clearSession } from '@/features/pause/public';
import {
  buildPauseContextFromMarket,
  getManualReflectionCooldownMs,
  isHolzenDevMode,
} from '@/features/market/public';
import { normalizeTrackedAssetId, trackedAssetSymbol } from '@/features/market/public';
import { severityFromBtcChangePercent } from '@/features/market/public';
import { millisecondsUntilNextQuarterHour } from '@/screens/home/lib/next-cron-quarter';
import { openManualPauseFromHome } from '@/features/pause/public-rpc';
import type { OpenManualPauseFromHomeResult } from '@/features/pause/public-rpc';
import { trackEvent } from '@/lib/posthog';
import {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type ManualPauseTriggerResult,
} from '@/features/pause/public';

const PAUSE_MANUAL_START_HOME = 'holzen_sess_pause_manual_started_home';

export { holzenMarketDisplayQueryKey };

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

  const [message, setMessage] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [companions, setCompanions] = useState<CompanionData>({
    haiku: null,
    groundingTitle: null,
    groundingBody: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** True briefly after a new pause message is shown — Home uses it for one-shot chime. */
  const [newPauseArrival, setNewPauseArrival] = useState(false);
  const [lastPauseInstanceId, setLastPauseInstanceId] = useState<string | null>(null);
  /** From `v_pause_current.state` — `active` vs `engaged` for Home CTA copy. */
  const [openPauseState, setOpenPauseState] = useState<'active' | 'engaged' | null>(null);
  const [lastTriggerAt, setLastTriggerAt] = useState<string | null>(null);

  const clearOpenPausePreview = useCallback(() => {
    setLastPauseInstanceId(null);
    setOpenPauseState(null);
    setLastTriggerAt(null);
    setMessage(null);
    setContext(null);
    setCompanions({ haiku: null, groundingTitle: null, groundingBody: null });
    clearSession();
  }, []);

  /** Re-read v_pause_current + artifacts so Home matches Library after completes / dismissals. */
  const syncOpenPauseFromDb = useCallback(async (signal?: AbortSignal) => {
    const dead = () => signal?.aborted ?? false;
    if (!user) {
      clearOpenPausePreview();
      return;
    }
    const preview = await fetchOpenPauseHomePreview(user.id);

    if (dead()) return;

    if (!preview) {
      clearOpenPausePreview();
      return;
    }

    setLastPauseInstanceId(preview.pauseInstanceId);
    setOpenPauseState(preview.openPauseState);
    setLastTriggerAt(preview.createdAt);
    setContext(preview.contextText);
    setMessage(preview.reflectionMessage);
    setCompanions(preview.companions);
  }, [user, clearOpenPausePreview]);

  // Hydrate open pause on login; keep in sync when pause_instances changes (complete / dismiss / cron).
  useEffect(() => {
    const ac = new AbortController();
    void syncOpenPauseFromDb(ac.signal);
    return () => ac.abort();
  }, [syncOpenPauseFromDb]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`holzen-open-pause-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pause_instances',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void syncOpenPauseFromDb();
        },
      )
      .subscribe();

    return () => {
      if (typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel);
      }
    };
  }, [user, syncOpenPauseFromDb]);

  /** Create the V2 pause instance (reflection AI runs at Reflect step). */
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

      const assetId = normalizeTrackedAssetId(profile.trackedAssetId);
      const assetSym = trackedAssetSymbol(assetId);
      const ctx = buildPauseContextFromMarket(data, profile.cumulativeThreshold, assetSym);
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
      profile.cumulativeThreshold,
      profile.trackedAssetId,
      syncOpenPauseFromDb,
    ],
  );

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
