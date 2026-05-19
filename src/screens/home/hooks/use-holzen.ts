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
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import type { CompanionData } from '@/screens/pause/components/CompanionSection';
import { holzenLog } from '@/lib/holzen-console';
import { clearSession, reflectionPersistErrorMessage } from '@/features/pause/public';
import {
  buildPauseContextFromMarket,
  getManualReflectionCooldownMs,
  isHolzenDevMode,
} from '@/features/market/public';
import { normalizeTrackedAssetId, trackedAssetSymbol } from '@/features/market/public';
import { severityFromBtcChangePercent } from '@/features/market/public';
import { millisecondsUntilNextQuarterHour } from '@/lib/next-cron-quarter';
import {
  bucketChangePercent,
  computeContextFingerprint,
  pauseCreateSkippedUserMessage,
} from '@/features/pause/public';
import { pauseCreateOrReuse } from '@/features/pause/public-rpc';
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
    const { data } = await supabase
      .from('v_pause_current' as never)
      .select('id, created_at, context_snapshot, state')
      .eq('user_id', user.id)
      .maybeSingle();

    if (dead()) return;

    if (!data) {
      clearOpenPausePreview();
      return;
    }

    const row = data as {
      id: string;
      created_at: string;
      context_snapshot: Record<string, unknown> | null;
      state?: string;
    };
    setLastPauseInstanceId(row.id);
    setOpenPauseState(row.state === 'engaged' ? 'engaged' : row.state === 'active' ? 'active' : null);
    setLastTriggerAt(row.created_at);
    const ctxText = typeof row.context_snapshot?.context_text === 'string'
      ? (row.context_snapshot.context_text as string)
      : null;
    setContext(ctxText);

    const { data: artifacts } = await supabase
      .from('pause_ai_artifacts' as never)
      .select('kind, content')
      .eq('pause_instance_id', row.id);

    if (dead()) return;

    let msg: string | null = null;
    let haiku: string | null = null;
    let groundingTitle: string | null = null;
    let groundingBody: string | null = null;
    for (const a of ((artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>)) {
      if (a.kind === 'reflection_text' && typeof a.content?.message === 'string') {
        msg = a.content.message as string;
      } else if (a.kind === 'haiku' && typeof a.content?.haiku === 'string') {
        haiku = a.content.haiku as string;
      } else if (a.kind === 'ground_nudge') {
        if (typeof a.content?.title === 'string') groundingTitle = a.content.title as string;
        if (typeof a.content?.body === 'string') groundingBody = a.content.body as string;
      }
    }
    setMessage(msg);
    setCompanions({ haiku, groundingTitle, groundingBody });
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
      const directionBucket = data.changePercent < 0 ? 'down' : 'up';
      const severityBand = severityFromBtcChangePercent(data.changePercent) ?? 'mild';
      const onChainBand =
        assetId === 'bitcoin' && data.onChain
          ? ([data.onChain.mempoolSize, data.onChain.fastestFee, data.onChain.medianFee].filter(
              (x) => typeof x === 'number' && Number.isFinite(x),
            ) as number[]).join(':') || null
          : null;
      const fingerprint = await computeContextFingerprint({
        templateSlug: 'volatility_v1',
        directionBucket,
        severityBand,
        dailyBucketPct: bucketChangePercent(data.changePercent),
        cumulativeBucketPct: bucketChangePercent(data.cumulativeChangePercent ?? 0),
        trackedAssetId: assetId,
        fearGreedBand: data.fearGreed?.label ?? null,
        onChainBand,
      });

      if (silentMode) {
        holzenLog.manual('generateMessage: silent mode');
        const silentMsg = `${assetSym} moved.`;

        try {
          const res = await pauseCreateOrReuse({
            templateSlug: 'volatility_v1',
            source: 'manual',
            contextSnapshot: {
              change_24h_pct: data.changePercent,
              change_7d_pct: data.cumulativeChangePercent ?? null,
              direction: directionBucket,
              severity: severityBand,
              context_text: ctx,
              last_reported_mood: mood ?? null,
              tracked_asset_id: assetId,
            },
            contextRuleResult: { triggered: ['manual'] },
            contextFingerprint: fingerprint,
          });
          if (!res.instance_id) {
            setError(pauseCreateSkippedUserMessage(res.reused_reason));
            return MANUAL_PAUSE_TRIGGER_IDLE;
          }
          const isPendingOffer = res.pending_offer === true;
          if (!isPendingOffer) {
            clearSession();
            setLastPauseInstanceId(res.instance_id);
          }
          if (res.created) {
            try {
              trackEvent('pause_instance_created', {
                pause_instance_id: res.instance_id,
                template_slug: 'volatility_v1',
                source: 'manual',
                severity: severityBand,
                pending_offer: isPendingOffer,
              });
            } catch {
              /* no-op */
            }
          }
          await supabase.from('pause_ai_artifacts' as never).upsert(
            {
              pause_instance_id: res.instance_id,
              user_id: user.id,
              kind: 'reflection_text',
              content: { message: silentMsg, context: ctx },
            } as never,
            { onConflict: 'pause_instance_id,kind' } as never,
          );
          if (!isPendingOffer) {
            setMessage(silentMsg);
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
          }
          if (!isPendingOffer) {
            await syncOpenPauseFromDb();
          }
          return {
            opened: true,
            instanceId: res.instance_id,
            context: ctx,
            pendingOffer: isPendingOffer || undefined,
          };
        } catch (e: unknown) {
          holzenLog.manual('generateMessage: silent pause create failed', {
            message: e instanceof Error ? e.message : String(e),
          });
          setError(reflectionPersistErrorMessage(e));
          return MANUAL_PAUSE_TRIGGER_IDLE;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const res = await pauseCreateOrReuse({
          templateSlug: 'volatility_v1',
          source: 'manual',
          contextSnapshot: {
            change_24h_pct: data.changePercent,
            change_7d_pct: data.cumulativeChangePercent ?? null,
            direction: directionBucket,
            severity: severityBand,
            context_text: ctx,
            last_reported_mood: mood ?? null,
            tracked_asset_id: assetId,
          },
          contextRuleResult: { triggered: ['manual'] },
          contextFingerprint: fingerprint,
        });

        if (!res.instance_id) {
          holzenLog.manual('generateMessage: reuse/skip', { reason: res.reused_reason });
          setError(pauseCreateSkippedUserMessage(res.reused_reason));
          return MANUAL_PAUSE_TRIGGER_IDLE;
        }

        const isPendingOffer = res.pending_offer === true;

        if (res.created) {
          try {
            trackEvent('pause_instance_created', {
              pause_instance_id: res.instance_id,
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
          clearSession();
          setLastPauseInstanceId(res.instance_id);
          setContext(ctx);
          setMessage(null);
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
        }
        if (!isPendingOffer) {
          await syncOpenPauseFromDb();
        }
        return {
          opened: true,
          instanceId: res.instance_id,
          context: ctx,
          pendingOffer: isPendingOffer || undefined,
        };
      } catch (e: unknown) {
        const raw = e instanceof Error ? e.message : String(e);
        holzenLog.manual('generateMessage: error', { message: raw });
        if (raw.includes('fetch') || raw.includes('network') || raw.includes('Failed to fetch')) {
          setError('Could not reach Holzen. Check your connection.');
        } else {
          setError('Could not open a pause right now. Try again shortly.');
        }
        return MANUAL_PAUSE_TRIGGER_IDLE;
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
