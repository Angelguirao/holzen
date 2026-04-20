import { useState, useEffect, useCallback } from 'react';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import type { CompanionData } from '@/components/CompanionSection';
import { holzenLog } from '@/lib/holzen-console';
import { COMPANION_TYPES } from '@/lib/companion-types';
import { reflectionPersistErrorMessage } from '@/lib/reflection-persist-error';
import { getManualReflectionCooldownMs, isHolzenDevMode } from '@/lib/holzen-manual-cooldown';
import { buildPauseContextFromBtc } from '@/lib/pause-context-from-btc';
import { severityFromBtcChangePercent } from '@/lib/btc-move-severity';
import { millisecondsUntilNextQuarterHour } from '@/lib/next-cron-quarter';

export function useHolzen() {
  const { user } = useAuth();
  const profile = useProfile();

  const {
    _profileLoadReflectionData,
    reflectionTone,
    reflectionStyle,
    silentMode,
    cumulativeThreshold,
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
  const [companions, setCompanions] = useState<CompanionData>({ haiku: null, groundingTitle: null, groundingBody: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newReflection, setNewReflection] = useState(false);
  const [lastReflectionId, setLastReflectionId] = useState<string | null>(null);
  const [lastTriggerAt, setLastTriggerAt] = useState<string | null>(null);

  // Handle reflection data from profile load
  useEffect(() => {
    if (!_profileLoadReflectionData) return;
    const { lastMessage, lastContext, lastTriggerAt: lta } = _profileLoadReflectionData;
    setLastTriggerAt(lta);
    setMessage(lastMessage);
    setContext(lastContext);

    if (lastMessage && user) {
      supabase
        .from('v_reflection_with_companions')
        .select('id, haiku, grounding_title, grounding_body')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data: latestReflection }) => {
          if (latestReflection) {
            setLastReflectionId(latestReflection.id);
            setCompanions({
              haiku: latestReflection.haiku ?? null,
              groundingTitle: latestReflection.grounding_title ?? null,
              groundingBody: latestReflection.grounding_body ?? null,
            });
          }
        });
    }
  }, [_profileLoadReflectionData, user]);

  // Companion pre-generation is handled by the companion-orchestrate edge function,
  // called from use-companion-data.ts when the companion section renders.
  // Server-side triggers (check-volatility) also pre-generate via the orchestrator.
  // This eliminates the previous triple-invocation race condition.

  /**
   * Generates a reflection and inserts a `reflections` row.
   *
   * **Optional `mood`:** If passed, stored on that row at insert time (e.g. silent mode or a future Home mood chip). Home’s “Need a moment” / “Try again” flows omit it: the user sets mood later on the **Feel** step in `/pause`, which updates the row — see `PauseSession.handleMoodSelect`. Automatic pauses set mood server-side (e.g. `check-volatility` + `lastReportedMood`).
   */
  const generateMessage = useCallback(async (data: BtcPriceData, mood?: string) => {
    if (!user) {
      holzenLog.manual( 'generateMessage: skipped (no user)');
      return;
    }
    holzenLog.manual( 'generateMessage: start', {
      btcChangePct: data.changePercent,
      cumulativePct: data.cumulativeChangePercent,
      silentMode,
      mood: mood ?? '(none)',
    });
    const ctx = buildPauseContextFromBtc(data, cumulativeThreshold);

    if (silentMode) {
      holzenLog.manual( 'generateMessage: silent mode — short reflection only (no AI)');
      const silentMsg = 'BTC moved.';
      setMessage(silentMsg);
      setContext(ctx);
      setCompanions({ haiku: null, groundingTitle: null, groundingBody: null });
      setNewReflection(true);

      const { data: insertedReflection, error: silentInsertErr } = await supabase.from('reflections').insert({
        user_id: user.id,
        message: silentMsg,
        context: ctx,
        source: 'manual',
        ...(mood ? { mood } : {}),
      }).select('id').single();

      if (silentInsertErr || !insertedReflection) {
        holzenLog.manual('generateMessage: silent reflections insert failed', { message: silentInsertErr?.message ?? 'no row' });
        setMessage(null);
        setContext(null);
        setCompanions({ haiku: null, groundingTitle: null, groundingBody: null });
        setNewReflection(false);
        setError(reflectionPersistErrorMessage(silentInsertErr));
        return;
      }

      setLastReflectionId(insertedReflection.id);
      // Run library bookmark and profile update in parallel — neither depends on the other
      await Promise.all([
        supabase.from('library_items').upsert(
          {
            user_id: user.id,
            type: 'bookmark',
            title: 'Reflection',
            body: silentMsg,
            source_type: 'reflection',
            reflection_id: insertedReflection.id,
            tags: ['reflection'],
          },
          { onConflict: 'user_id,reflection_id,source_type', ignoreDuplicates: true },
        ),
        supabase.from('profiles').update({
          last_message: silentMsg,
          last_context: ctx,
          last_trigger_at: new Date().toISOString(),
        }).eq('user_id', user.id),
      ]);

      setLastTriggerAt(new Date().toISOString());
      holzenLog.manual( 'generateMessage: silent mode done', { reflectionId: insertedReflection?.id });
      return;
    }

    setLoading(true);
    setError(null);

    let moodHistory: { mood: string; outcome: string | null; created_at: string }[] = [];
    let recentHaikus: string[] = [];
    let recentMessages: string[] = [];
    try {
      const { data: recentReflections } = await supabase
        .from('reflections')
        .select('mood, outcome, created_at, haiku, message')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      moodHistory = (recentReflections ?? [])
        .filter((r: any) => r.mood)
        .map((r: any) => ({ mood: r.mood, outcome: r.outcome, created_at: r.created_at }));
      recentHaikus = (recentReflections ?? [])
        .filter((r: any) => r.haiku)
        .map((r: any) => r.haiku as string)
        .slice(0, 5);
      recentMessages = (recentReflections ?? [])
        .filter((r: any) => r.message)
        .map((r: any) => r.message as string)
        .slice(0, 5);
    } catch { /* non-critical */ }

    holzenLog.manual( 'generateMessage: calling edge function holzen-reflect', {
      contextPreview: ctx.slice(0, 120),
      moodHistoryCount: moodHistory.length,
    });

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('holzen-reflect', {
        body: {
          context: ctx,
          tone: reflectionTone,
          customPrompt: customPrompt || undefined,
          style: reflectionStyle,
          moodHistory,
          severity: Math.abs(data.changePercent),
          motivations: motivations.length > 0 ? motivations : undefined,
          mantra: mantra || undefined,
          groundingActivities: groundingActivities.length > 0 ? groundingActivities : undefined,
          currency,
          language,
          recentHaikus,
          recentMessages,
        },
      });

      if (fnError) throw fnError;

      const msg = fnData?.message;
      holzenLog.manual( 'generateMessage: holzen-reflect returned', {
        ok: !!msg,
        messageLen: typeof msg === 'string' ? msg.length : 0,
        hasHaiku: !!fnData?.haiku,
      });
      if (msg) {
        setMessage(msg);
        setContext(ctx);
        setNewReflection(true);

        const companionData: CompanionData = {
          haiku: fnData?.haiku ?? null,
          groundingTitle: fnData?.grounding_title ?? null,
          groundingBody: fnData?.grounding_body ?? null,
        };
        setCompanions(companionData);

        const { data: insertedReflection, error: insertErr } = await supabase.from('reflections').insert({
          user_id: user.id,
          message: msg,
          context: ctx,
          haiku: companionData.haiku,
          source: 'manual',
          ...(mood ? { mood } : {}),
        }).select('id').single();

        if (insertErr || !insertedReflection) {
          holzenLog.manual('generateMessage: reflections insert failed', { message: insertErr?.message ?? 'no row' });
          setMessage(null);
          setContext(null);
          setCompanions({ haiku: null, groundingTitle: null, groundingBody: null });
          setNewReflection(false);
          setError(reflectionPersistErrorMessage(insertErr));
          return;
        }

        setLastReflectionId(insertedReflection.id);
        const libraryInserts: any[] = [
          {
            user_id: user.id,
            type: 'bookmark',
            title: 'Reflection',
            body: msg,
            source_type: 'reflection',
            reflection_id: insertedReflection.id,
            tags: ['reflection'],
          },
        ];
        if (companionData.haiku) {
          libraryInserts.push({
            user_id: user.id,
            type: 'bookmark',
            title: 'Haiku',
            body: companionData.haiku,
            source_type: 'haiku',
            reflection_id: insertedReflection.id,
            tags: [],
          });
        }
        // Keep reflection_companions.ground_nudge aligned with reflections.grounding_* (same as writeCompanionData).
        const hasInitialGrounding = Boolean(companionData.groundingTitle || companionData.groundingBody);
        const groundingRowPromise = hasInitialGrounding
          ? supabase.from('reflection_companions').upsert(
              {
                reflection_id: insertedReflection.id,
                companion_type: COMPANION_TYPES.GROUNDING,
                content: {
                  title: companionData.groundingTitle ?? '',
                  body: companionData.groundingBody ?? '',
                  citation: typeof fnData?.grounding_citation === 'string' ? fnData.grounding_citation : '',
                  url: typeof fnData?.grounding_url === 'string' ? fnData.grounding_url : '',
                },
                read: false,
              },
              { onConflict: 'reflection_id,companion_type' },
            )
          : Promise.resolve({ error: null });

        // Library + profile + optional ground_nudge row (same shape as writeCompanionData)
        const [{ error: libErr }, , { error: groundNudgeErr }] = await Promise.all([
          supabase.from('library_items').upsert(libraryInserts, {
            onConflict: 'user_id,reflection_id,source_type',
            ignoreDuplicates: true,
          }),
          supabase.from('profiles').update({
            last_message: msg,
            last_context: ctx,
          }).eq('user_id', user.id),
          groundingRowPromise,
        ]);
        if (libErr) console.error('[library] reflection+haiku insert failed:', libErr.message);
        if (groundNudgeErr) {
          console.error('[reflection_companions] ground_nudge upsert failed:', groundNudgeErr.message);
          holzenLog.manual('generateMessage: ground_nudge sync failed', { message: groundNudgeErr.message });
        }
        if (!libErr) {
          holzenLog.manual('generateMessage: DB insert + profile update ok', {
            reflectionId: insertedReflection.id,
            syncedGroundNudge: hasInitialGrounding && !groundNudgeErr,
          });
        }
      }
    } catch (e: any) {
      holzenLog.manual('generateMessage: error', { message: String(e?.message ?? e) });
      const raw = e?.message || '';
      if (raw.includes('fetch') || raw.includes('network') || raw.includes('Failed to fetch')) {
        setError('Could not reach the reflection service. Check your connection.');
      } else if (raw.includes('rate') || raw.includes('limit') || raw.includes('429')) {
        setError('Too many requests — please wait a moment and try again.');
      } else {
        setError('AI reflection unavailable right now. Try again shortly.');
      }
    } finally {
      setLoading(false);
      holzenLog.manual( 'generateMessage: finished (loading cleared)');
    }
  }, [
    user,
    reflectionTone,
    reflectionStyle,
    silentMode,
    cumulativeThreshold,
    customPrompt,
    motivations,
    mantra,
    groundingActivities,
    currency,
    language,
  ]);

  const fetchBtcDisplay = useCallback(async () => {
    try {
      const data = await fetchBtcData(currency);
      setBtcData(data);
    } catch (e: any) {
      const raw = e?.message || '';
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

  // Other tabs update the same key — same-window updates use setState in manualTrigger.
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

  /** “Need a moment” / “Try again” (cooldown-gated). Optional `mood` → see `generateMessage`. */
  const manualTrigger = useCallback(async (mood?: string) => {
    const remaining = manualCooldownRemaining();
    if (remaining > 0) {
      holzenLog.manual( 'manualTrigger: blocked by cooldown', { remainingMs: remaining, devMode: isHolzenDevMode() });
      return;
    }

    holzenLog.manual( 'manualTrigger: start (Need a moment / Try again)', { mood: mood ?? '(none)', hasCachedBtc: !!btcData });

    try {
      const data = btcData || await fetchBtcData(currency);
      if (!btcData) {
        holzenLog.manual( 'manualTrigger: fetched BTC for context', {
          changePct: data.changePercent,
        });
        setBtcData(data);
      } else {
        holzenLog.manual( 'manualTrigger: using cached btcData');
      }
      await generateMessage(data, mood);
      const now = Date.now();
      setLastManualAt(now);
      localStorage.setItem(manualCooldownKey, String(now));
      // Next allowed manual trigger: now + getManualReflectionCooldownMs() (15 min prod; 5 s when holzen_dev_mode).
      holzenLog.manual('manualTrigger: complete — cooldown stored', { lastManualAt: now });
    } catch (e: any) {
      holzenLog.manual('manualTrigger: error', { message: String(e?.message ?? e) });
      const raw = e?.message || '';
      if (raw.includes('fetch') || raw.includes('Failed to fetch')) {
        setError('Could not connect. Check your internet and try again.');
      } else {
        setError('Reflection could not be generated right now. Try again in a moment.');
      }
    }
  }, [btcData, generateMessage, manualCooldownRemaining, currency, manualCooldownKey]);

  const dismissMessage = useCallback(async () => {
    setMessage(null);
    setContext(null);
    setCompanions({ haiku: null, groundingTitle: null, groundingBody: null });
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ last_message: null, last_context: null })
      .eq('user_id', user.id);
  }, [user]);

  /** Re-read profile from DB — used when realtime detects a server-side trigger */
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('last_message, last_context, last_trigger_at')
      .eq('user_id', user.id)
      .single();
    if (!data) return;
    if (data.last_trigger_at) {
      setLastTriggerAt(data.last_trigger_at);
    }
    if (data.last_message && data.last_message !== message) {
      setMessage(data.last_message);
      setContext(data.last_context);
      setNewReflection(true);
      const { data: latest } = await supabase
        .from('v_reflection_with_companions')
        .select('id, haiku, grounding_title, grounding_body')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (latest) {
        setLastReflectionId(latest.id);
        setCompanions({
          haiku: latest.haiku ?? null,
          groundingTitle: latest.grounding_title ?? null,
          groundingBody: latest.grounding_body ?? null,
        });
      }
    }
  }, [user, message]);

  const severity = severityFromBtcChangePercent(btcData?.changePercent);

  // Fetch BTC data on load and periodically (display only — no trigger logic)
  useEffect(() => {
    if (!profileLoaded) return;
    fetchBtcDisplay();
    const interval = setInterval(fetchBtcDisplay, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBtcDisplay, profileLoaded]);

  // Exclude internal field from the spread
  const { _profileLoadReflectionData: _, ...profileForReturn } = profile;

  return {
    ...profileForReturn,
    setCurrency: async (val: string) => {
      setBtcData(null);
      await profile.setCurrency(val);
    },
    btcData,
    message,
    context,
    companions,
    severity,
    lastReflectionId,
    loading,
    error,
    newReflection,
    clearNewReflection: () => setNewReflection(false),
    dismissMessage,
    manualTrigger,
    manualCooldownRemaining,
    autoCooldownRemaining,
    nextCronCheckIn,
    profileLoaded,
    refreshProfile,
  };
}
