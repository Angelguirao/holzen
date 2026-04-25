import { useState, useEffect, useCallback } from 'react';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import type { CompanionData } from '@/components/CompanionSection';
import { holzenLog } from '@/lib/holzen-console';
import { reflectionPersistErrorMessage } from '@/lib/reflection-persist-error';
import { getManualReflectionCooldownMs, isHolzenDevMode } from '@/lib/holzen-manual-cooldown';
import { buildPauseContextFromBtc } from '@/lib/pause-context-from-btc';
import { severityFromBtcChangePercent } from '@/lib/btc-move-severity';
import { millisecondsUntilNextQuarterHour } from '@/lib/next-cron-quarter';
import { pauseCreateOrReuse } from '@/lib/pause-api';
import {
  bucketChangePercent,
  computeContextFingerprint,
} from '@/lib/pause-fingerprint';
import { loadReflectRecencyHints } from '@/lib/load-reflect-recency-hints';
import { trackEvent } from '@/lib/posthog';

const REFLECT_START_HOME = 'holzen_sess_reflection_started_home';

function markReflectionStartedHomeOnce(): void {
  try {
    if (sessionStorage.getItem(REFLECT_START_HOME)) return;
    sessionStorage.setItem(REFLECT_START_HOME, '1');
    trackEvent('reflection.started', { source: 'home' });
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
  const [lastTriggerAt, setLastTriggerAt] = useState<string | null>(null);

  // Hydrate "open pause" state on mount.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('v_pause_current' as never)
        .select('id, created_at, context_snapshot')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      const row = data as {
        id: string;
        created_at: string;
        context_snapshot: Record<string, unknown> | null;
      };
      setLastPauseInstanceId(row.id);
      setLastTriggerAt(row.created_at);
      const ctxText = typeof row.context_snapshot?.context_text === 'string'
        ? (row.context_snapshot.context_text as string)
        : null;
      setContext(ctxText);

      // Pull reflection_text + companion artifacts for preview.
      const { data: artifacts } = await supabase
        .from('pause_ai_artifacts' as never)
        .select('kind, content')
        .eq('pause_instance_id', row.id);
      if (cancelled) return;
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
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  /** Generate reflect-step text (holzen-reflect) and create the V2 pause instance + artifacts. */
  const generateMessage = useCallback(
    async (data: BtcPriceData, mood?: string) => {
      if (!user) {
        holzenLog.manual('generateMessage: skipped (no user)');
        return;
      }
      markReflectionStartedHomeOnce();
      const t0 = Date.now();
      holzenLog.manual('generateMessage: start', {
        btcChangePct: data.changePercent,
        silentMode,
        mood: mood ?? '(none)',
      });

      const ctx = buildPauseContextFromBtc(data, profile.cumulativeThreshold);
      const directionBucket = data.changePercent < 0 ? 'down' : 'up';
      const severityBand = severityFromBtcChangePercent(data.changePercent) ?? 'mild';
      const fingerprint = await computeContextFingerprint({
        templateSlug: 'volatility_v1',
        directionBucket,
        severityBand,
        dailyBucketPct: bucketChangePercent(data.changePercent),
        cumulativeBucketPct: bucketChangePercent(data.cumulativeChangePercent ?? 0),
      });

      if (silentMode) {
        holzenLog.manual('generateMessage: silent mode');
        const silentMsg = 'BTC moved.';
        setMessage(silentMsg);
        setContext(ctx);
        setCompanions({ haiku: null, groundingTitle: null, groundingBody: null });
        setNewPauseArrival(true);

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
            },
            contextRuleResult: { triggered: ['manual'] },
            contextFingerprint: fingerprint,
          });
          if (!res.instance_id) return;
          setLastPauseInstanceId(res.instance_id);
          if (res.created) {
            try {
              trackEvent('pause_instance_created', {
                pause_instance_id: res.instance_id,
                template_slug: 'volatility_v1',
                source: 'manual',
                severity: severityBand,
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
          await supabase.from('library_items').upsert(
            {
              user_id: user.id,
              type: 'bookmark',
              title: 'Pause',
              body: silentMsg,
              source_type: 'reflection',
              pause_instance_id: res.instance_id,
              tags: ['reflection'],
            } as never,
            { onConflict: 'user_id,pause_instance_id,source_type', ignoreDuplicates: true } as never,
          );
          setLastTriggerAt(new Date().toISOString());
          try {
            trackEvent('reflection.completed', {
              duration_s: Math.round((Date.now() - t0) / 1000),
              had_bitcoin_context: Boolean(ctx),
              companion_types: [],
            });
          } catch {
            /* no-op */
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
        const { data: fnData, error: fnError } = await supabase.functions.invoke('holzen-reflect', {
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

        if (res.created) {
          try {
            trackEvent('pause_instance_created', {
              pause_instance_id: res.instance_id,
              template_slug: 'volatility_v1',
              source: 'manual',
              severity: severityBand,
            });
          } catch {
            /* no-op */
          }
        }

        setLastPauseInstanceId(res.instance_id);
        setMessage(msg);
        setContext(ctx);
        setCompanions(companionData);
        setNewPauseArrival(true);

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
        if (companionData.haiku) {
          artifacts.push({
            pause_instance_id: res.instance_id,
            user_id: user.id,
            kind: 'haiku',
            content: { haiku: companionData.haiku },
          });
        }
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

        await supabase.from('library_items').upsert(
          {
            user_id: user.id,
            type: 'bookmark',
            title: 'Pause',
            body: msg,
            source_type: 'reflection',
            pause_instance_id: res.instance_id,
            tags: ['reflection'],
          } as never,
          {
            onConflict: 'user_id,pause_instance_id,source_type',
            ignoreDuplicates: true,
          } as never,
        );

        setLastTriggerAt(new Date().toISOString());
        try {
          trackEvent('reflection.completed', {
            duration_s: Math.round((Date.now() - t0) / 1000),
            had_bitcoin_context: Boolean(ctx),
            companion_types: previewCompanionTypeTags(companionData),
          });
        } catch {
          /* no-op */
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
    ],
  );

  const fetchBtcDisplay = useCallback(async () => {
    try {
      const data = await fetchBtcData(currency);
      setBtcData(data);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e);
      if (raw.includes('fetch') || raw.includes('Failed to fetch')) {
        setError('Price data unavailable. CoinGecko may be down — retrying shortly.');
      } else {
        setError('Could not check market data. Will retry automatically.');
      }
    }
  }, [currency]);

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
        const data = btcData || (await fetchBtcData(currency));
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
    [btcData, generateMessage, manualCooldownRemaining, currency, manualCooldownKey],
  );

  const dismissMessage = useCallback(async () => {
    setMessage(null);
    setContext(null);
    setCompanions({ haiku: null, groundingTitle: null, groundingBody: null });
    setLastPauseInstanceId(null);
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

  const severity = severityFromBtcChangePercent(btcData?.changePercent);

  useEffect(() => {
    if (!profileLoaded) return;
    fetchBtcDisplay();
    const interval = setInterval(fetchBtcDisplay, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBtcDisplay, profileLoaded]);

  return {
    ...profile,
    setCurrency: async (val: string) => {
      setBtcData(null);
      await profile.setCurrency(val);
    },
    btcData,
    message,
    context,
    companions,
    severity,
    lastPauseInstanceId,
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
  };
}
