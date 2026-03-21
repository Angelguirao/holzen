import { useState, useEffect, useCallback } from 'react';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import type { CompanionData } from '@/components/CompanionSection';

const MANUAL_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes for on-demand
const DEV_COOLDOWN_MS = 5 * 1000; // 5 seconds in dev mode

function getEffectiveCooldownMs(): number {
  try {
    return localStorage.getItem('holzen_dev_mode') === 'true' ? DEV_COOLDOWN_MS : MANUAL_COOLDOWN_MS;
  } catch { return MANUAL_COOLDOWN_MS; }
}

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
  const [companions, setCompanions] = useState<CompanionData>({ haiku: null, learningTitle: null, learningBody: null });
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
        .from('reflections')
        .select('id, haiku, learning_title, learning_body')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data: latestReflection }) => {
          if (latestReflection) {
            setLastReflectionId(latestReflection.id);
            setCompanions({
              haiku: latestReflection.haiku ?? null,
              learningTitle: latestReflection.learning_title ?? null,
              learningBody: latestReflection.learning_body ?? null,
            });
          }
        });
    }
  }, [_profileLoadReflectionData, user]);

  // Companion pre-generation is handled by the companion-orchestrate edge function,
  // called from use-companion-data.ts when the companion section renders.
  // Server-side triggers (check-volatility) also pre-generate via the orchestrator.
  // This eliminates the previous triple-invocation race condition.

  const generateMessage = useCallback(async (data: BtcPriceData, mood?: string) => {
    if (!user) return;
    const dir = data.direction === 'down' ? 'down' : 'up';
    const pct = Math.abs(data.changePercent).toFixed(1);
    let ctx = `BTC is ${dir} ${pct}% in the last 24 hours.`;
    if (data.cumulativeChangePercent !== undefined && Math.abs(data.cumulativeChangePercent) >= cumulativeThreshold) {
      const cumDir = data.cumulativeDirection === 'down' ? 'down' : 'up';
      ctx += ` Over 7 days, it's ${cumDir} ${Math.abs(data.cumulativeChangePercent).toFixed(1)}%.`;
    }
    if (data.fearGreed) {
      ctx += ` Market sentiment: ${data.fearGreed.label} (${data.fearGreed.value}/100).`;
    }
    if (data.onChain) {
      const oc = data.onChain;
      if (oc.mempoolSize) ctx += ` Mempool: ${oc.mempoolSize.toLocaleString()} unconfirmed txs.`;
      if (oc.fastestFee) ctx += ` Fees: ${oc.fastestFee} sat/vB (fastest), ${oc.medianFee ?? '?'} sat/vB (medium).`;
      if (oc.hashrate) ctx += ` Hashrate: ${oc.hashrate}.`;
      if (oc.blockHeight) ctx += ` Block height: ${oc.blockHeight.toLocaleString()}.`;
    }

    if (silentMode) {
      const silentMsg = 'BTC moved.';
      setMessage(silentMsg);
      setContext(ctx);
      setCompanions({ haiku: null, learningTitle: null, learningBody: null });
      setNewReflection(true);

      const { data: insertedReflection } = await supabase.from('reflections').insert({
        user_id: user.id,
        message: silentMsg,
        context: ctx,
        ...(mood ? { mood } : {}),
      }).select('id').single();

      if (insertedReflection) {
        setLastReflectionId(insertedReflection.id);
        await supabase.from('library_items').insert({
          user_id: user.id,
          type: 'bookmark',
          title: 'Reflection',
          body: silentMsg,
          source_type: 'reflection',
          reflection_id: insertedReflection.id,
          tags: ['reflection'],
        });
      }

      await supabase.from('profiles').update({
        last_message: silentMsg,
        last_context: ctx,
        last_trigger_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      setLastTriggerAt(new Date().toISOString());
      return;
    }

    setLoading(true);
    setError(null);

    let moodHistory: { mood: string; outcome: string | null; created_at: string }[] = [];
    let recentHaikus: string[] = [];
    let recentMessages: string[] = [];
    let recentSignalSources: string[] = [];
    let learningSources: { name: string; url?: string }[] = [];
    try {
      const [{ data: recentReflections }, { data: catalogSources }, { data: userPrefs }] = await Promise.all([
        supabase
          .from('reflections')
          .select('mood, outcome, created_at, haiku, signal_source, message')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('signal_sources').select('id, name, url').eq('category', 'learning'),
        supabase.from('user_signal_preferences').select('source_id, active, custom_name, custom_url, category').eq('user_id', user.id).eq('category', 'learning'),
      ]);
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
      recentSignalSources = (recentReflections ?? [])
        .filter((r: any) => r.signal_source)
        .map((r: any) => r.signal_source as string)
        .slice(0, 5);

      const disabledIds = new Set((userPrefs ?? []).filter((p: any) => p.source_id && !p.active).map((p: any) => p.source_id));
      const catalogActive = (catalogSources ?? [])
        .filter((s: any) => !disabledIds.has(s.id))
        .map((s: any) => ({ name: s.name, url: s.url }));
      const customActive = (userPrefs ?? [])
        .filter((p: any) => !p.source_id && p.custom_name && p.active)
        .map((p: any) => ({ name: p.custom_name, url: p.custom_url }));
      learningSources = [...catalogActive, ...customActive];
    } catch { /* non-critical */ }

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
          learningSources: learningSources.length > 0 ? learningSources : undefined,
        },
      });

      if (fnError) throw fnError;

      const msg = fnData?.message;
      if (msg) {
        setMessage(msg);
        setContext(ctx);
        setNewReflection(true);

        const companionData: CompanionData = {
          haiku: fnData?.haiku ?? null,
          learningTitle: fnData?.learning_title ?? null,
          learningBody: fnData?.learning_body ?? null,
        };
        setCompanions(companionData);

        const { data: insertedReflection } = await supabase.from('reflections').insert({
          user_id: user.id,
          message: msg,
          context: ctx,
          haiku: companionData.haiku,
          learning_title: companionData.learningTitle,
          learning_body: companionData.learningBody,
          learning_citation: fnData?.learning_citation ?? null,
          learning_url: fnData?.learning_url ?? null,
          ...(mood ? { mood } : {}),
        }).select('id').single();

        if (insertedReflection) {
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
          const { error: libErr } = await supabase.from('library_items').insert(libraryInserts);
          if (libErr) console.error('[library] reflection+haiku insert failed:', libErr.message);
        }

        await supabase.from('profiles').update({
          last_message: msg,
          last_context: ctx,
        }).eq('user_id', user.id);
      }
    } catch (e: any) {
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
    }
  }, [user, reflectionTone, reflectionStyle, silentMode, cumulativeThreshold, customPrompt]);

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

  const manualCooldownRemaining = useCallback(() => {
    if (!lastManualAt) return 0;
    const elapsed = Date.now() - lastManualAt;
    return Math.max(0, getEffectiveCooldownMs() - elapsed);
  }, [lastManualAt]);

  const autoCooldownRemaining = useCallback(() => {
    if (!lastTriggerAt) return 0;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(lastTriggerAt).getTime();
    return Math.max(0, cooldownMs - elapsed);
  }, [lastTriggerAt, cooldownHours]);

  /** Milliseconds until the next server cron quarter-hour (:00, :15, :30, :45) */
  const nextCronCheckIn = useCallback(() => {
    const now = new Date();
    const mins = now.getMinutes();
    const secs = now.getSeconds();
    const msIntoQuarter = ((mins % 15) * 60 + secs) * 1000 + now.getMilliseconds();
    const quarterMs = 15 * 60 * 1000;
    return quarterMs - msIntoQuarter;
  }, []);

  const manualTrigger = useCallback(async (mood?: string) => {
    const remaining = manualCooldownRemaining();
    if (remaining > 0) return;

    try {
      const data = btcData || await fetchBtcData(currency);
      if (!btcData) setBtcData(data);
      await generateMessage(data, mood);
      const now = Date.now();
      setLastManualAt(now);
      localStorage.setItem(manualCooldownKey, String(now));
    } catch (e: any) {
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
    setCompanions({ haiku: null, learningTitle: null, learningBody: null });
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
        .from('reflections')
        .select('id, haiku, learning_title, learning_body')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (latest) {
        setLastReflectionId(latest.id);
        setCompanions({
          haiku: latest.haiku ?? null,
          learningTitle: latest.learning_title ?? null,
          learningBody: latest.learning_body ?? null,
        });
      }
    }
  }, [user, message]);

  const severity: 'mild' | 'moderate' | 'high' = btcData
    ? Math.abs(btcData.changePercent) >= 10 ? 'high'
      : Math.abs(btcData.changePercent) >= 5 ? 'moderate'
      : 'mild'
    : 'mild';

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
