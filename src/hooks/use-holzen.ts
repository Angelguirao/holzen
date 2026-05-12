import { useState, useEffect, useCallback } from 'react';
import { fetchMarketData, type BtcPriceData } from '@/lib/btc';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdge } from '@/lib/invoke-edge';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import type { CompanionData } from '@/components/CompanionSection';
import { holzenLog } from '@/lib/holzen-console';
import { reflectionPersistErrorMessage } from '@/lib/reflection-persist-error';
import { getManualReflectionCooldownMs, isHolzenDevMode } from '@/lib/holzen-manual-cooldown';
import { buildPauseContextFromMarket } from '@/lib/pause-context-from-btc';
import { normalizeTrackedAssetId, trackedAssetSymbol } from '@/lib/tracked-assets';
import { severityFromBtcChangePercent } from '@/lib/btc-move-severity';
import { millisecondsUntilNextQuarterHour } from '@/lib/next-cron-quarter';
import { pauseCreateOrReuse } from '@/lib/pause-api';
import {
  bucketChangePercent,
  computeContextFingerprint,
} from '@/lib/pause-fingerprint';
import { loadReflectRecencyHints } from '@/lib/load-reflect-recency-hints';
import { trackEvent } from '@/lib/posthog';

const PAUSE_MANUAL_START_HOME = 'holzen_sess_pause_manual_started_home';

/** Once per tab session: user kicked off a manual “Need a moment” / holzen-reflect flow from Home. */
function markPauseManualStartedHomeOnce(): void {
  try {
    if (sessionStorage.getItem(PAUSE_MANUAL_START_HOME)) return;
    sessionStorage.setItem(PAUSE_MANUAL_START_HOME, '1');
    trackEvent('pause.manual_started', { surface: 'home' });
  } catch {
    /* sessionStorage */
  }
}

function previewCompanionTypeTags(c: CompanionData): string[] {
  const tags: string[] = [];
  if (c.haiku) tags.push('haiku');
  if (c.groundingTitle || c.groundingBody) tags.push('grounding');
  return tags;
}

/**
 * Pause V2 manual-trigger hook. Writes every generated pause straight
 * into pause_instances / pause_ai_artifacts via the Phase B RPCs +
 * service helpers. No legacy reflections writes.
 */
export function useHolzen() {
  const { user } = useAuth();
  const profile = useProfile();

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

  const [btcData, setBtcData] = useState<BtcPriceData | null>(null);
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
      supabase.removeChannel(channel);
    };
  }, [user, syncOpenPauseFromDb]);

  /** Generate reflect-step text (holzen-reflect) and create the V2 pause instance + artifacts. */
  const generateMessage = useCallback(
    async (data: BtcPriceData, mood?: string) => {
      if (!user) {
        holzenLog.manual('generateMessage: skipped (no user)');
        return;
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
          if (!res.instance_id) return;
          const isPendingOffer = res.pending_offer === true;
          if (!isPendingOffer) {
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
        } catch (e: unknown) {
          holzenLog.manual('generateMessage: silent pause create failed', {
            message: e instanceof Error ? e.message : String(e),
          });
          setError(reflectionPersistErrorMessage(e));
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { moodHistory, recentMessages, recentHaikus } = await loadReflectRecencyHints();
        const { data: fnData, error: fnError } = await invokeEdge<{
          message?: string;
          haiku?: CompanionData['haiku'];
          grounding_title?: string | null;
          grounding_body?: string | null;
          grounding_citation?: string | null;
          grounding_url?: string | null;
        }>('holzen-reflect', {
          body: {
            context: ctx,
            tone: reflectionTone,
            customPrompt: customPrompt || undefined,
            style: reflectionStyle,
            severity: Math.abs(data.changePercent),
            motivations: motivations.length > 0 ? motivations : undefined,
            mantra: mantra || undefined,
            groundingActivities: groundingActivities.length > 0 ? groundingActivities : undefined,
            currency,
            language,
            ...(moodHistory && moodHistory.length > 0 ? { moodHistory } : {}),
            ...(recentMessages && recentMessages.length > 0 ? { recentMessages } : {}),
            ...(recentHaikus && recentHaikus.length > 0 ? { recentHaikus } : {}),
          },
        });
        if (fnError) throw fnError;

        const msg: string | undefined = fnData?.message;
        if (!msg) throw new Error('No pause message returned');

        const companionData: CompanionData = {
          haiku: fnData?.haiku ?? null,
          groundingTitle: fnData?.grounding_title ?? null,
          groundingBody: fnData?.grounding_body ?? null,
        };

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
          setMessage(msg);
          setContext(ctx);
          setCompanions(companionData);
          setNewPauseArrival(true);
          return;
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
          setLastPauseInstanceId(res.instance_id);
          setMessage(msg);
          setContext(ctx);
          setCompanions(companionData);
          setNewPauseArrival(true);
        }

        const artifacts: Array<{
          pause_instance_id: string;
          user_id: string;
          kind: string;
          content: Record<string, unknown>;
        }> = [
          {
            pause_instance_id: res.instance_id,
            user_id: user.id,
            kind: 'reflection_text',
            content: { message: msg, context: ctx },
          },
        ];
        if (companionData.groundingTitle || companionData.groundingBody) {
          artifacts.push({
            pause_instance_id: res.instance_id,
            user_id: user.id,
            kind: 'ground_nudge',
            content: {
              title: companionData.groundingTitle ?? '',
              body: companionData.groundingBody ?? '',
              citation: typeof fnData?.grounding_citation === 'string' ? fnData.grounding_citation : '',
              url: typeof fnData?.grounding_url === 'string' ? fnData.grounding_url : '',
            },
          });
        }
        await supabase
          .from('pause_ai_artifacts' as never)
          .upsert(artifacts as never, { onConflict: 'pause_instance_id,kind' } as never);

        if (!isPendingOffer) {
          setLastTriggerAt(new Date().toISOString());
          try {
            trackEvent('pause.manual_completed', {
              duration_s: Math.round((Date.now() - t0) / 1000),
              had_bitcoin_context: assetId === 'bitcoin',
              tracked_asset_id: assetId,
              companion_types: previewCompanionTypeTags(companionData),
            });
          } catch {
            /* no-op */
          }
        }
      } catch (e: unknown) {
        const raw = e instanceof Error ? e.message : String(e);
        holzenLog.manual('generateMessage: error', { message: raw });
        if (raw.includes('fetch') || raw.includes('network') || raw.includes('Failed to fetch')) {
          setError('Could not reach Holzen. Check your connection.');
        } else if (raw.includes('rate') || raw.includes('limit') || raw.includes('429')) {
          setError('Too many requests — please wait a moment and try again.');
        } else {
          setError('AI pause prompt unavailable right now. Try again shortly.');
        }
      } finally {
        setLoading(false);
      }
    },
    [
      user,
      reflectionTone,
      reflectionStyle,
      silentMode,
      customPrompt,
      motivations,
      mantra,
      groundingActivities,
      currency,
      language,
      profile.cumulativeThreshold,
      profile.trackedAssetId,
    ],
  );

  const fetchBtcDisplay = useCallback(async () => {
    try {
      const data = await fetchMarketData(profileTrackedAssetId, currency);
      setBtcData(data);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e);
      if (raw.includes('fetch') || raw.includes('Failed to fetch')) {
        setError('Price data unavailable. CoinGecko may be down — retrying shortly.');
      } else {
        setError('Could not check market data. Will retry automatically.');
      }
    }
  }, [currency, profileTrackedAssetId]);

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
    async (mood?: string) => {
      const remaining = manualCooldownRemaining();
      if (remaining > 0) {
        holzenLog.manual('manualTrigger: blocked by cooldown', {
          remainingMs: remaining,
          devMode: isHolzenDevMode(),
        });
        return;
      }

      try {
        const data = btcData || (await fetchMarketData(profileTrackedAssetId, currency));
        if (!btcData) setBtcData(data);
        await generateMessage(data, mood);
        const now = Date.now();
        setLastManualAt(now);
        localStorage.setItem(manualCooldownKey, String(now));
      } catch (e: unknown) {
        const raw = e instanceof Error ? e.message : String(e);
        if (raw.includes('fetch') || raw.includes('Failed to fetch')) {
          setError('Could not connect. Check your internet and try again.');
        } else {
          setError('A pause message could not be generated right now. Try again in a moment.');
        }
      }
    },
    [btcData, generateMessage, manualCooldownRemaining, currency, manualCooldownKey, profileTrackedAssetId],
  );

  const dismissMessage = useCallback(async () => {
    if (!user) {
      clearOpenPausePreview();
      return;
    }

    const { error } = await supabase.rpc('pause_dismiss_current' as never);
    if (error) {
      holzenLog.pause('dismiss current pause failed; resyncing from DB', {
        message: error.message,
      });
      await syncOpenPauseFromDb();
      return;
    }

    clearOpenPausePreview();
  }, [user, clearOpenPausePreview, syncOpenPauseFromDb]);

  const refreshProfile = useCallback(async () => {
    // No-op in V2; the realtime subscription on pause_instances handles
    // fresh pushes from cron. Retained for API parity with old callers.
    return;
  }, []);

  const severity = severityFromBtcChangePercent(btcData?.changePercent);

  useEffect(() => {
    if (!profileLoaded) return;
    fetchBtcDisplay();
    const interval = setInterval(fetchBtcDisplay, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBtcDisplay, profileLoaded]);

  return {
    ...profile,
    /** CoinGecko id allowlist — normalized so consumers see `TrackedAssetId`, not raw profile strings. */
    trackedAssetId: normalizeTrackedAssetId(profile.trackedAssetId),
    setCurrency: async (val: string) => {
      setBtcData(null);
      await profile.setCurrency(val);
    },
    setTrackedAssetId: async (val: string) => {
      setBtcData(null);
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
    error,
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
