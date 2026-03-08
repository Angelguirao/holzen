import { useState, useEffect, useCallback } from 'react';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';

const MANUAL_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes for on-demand

export function useHolzen() {
  const { user } = useAuth();
  const [threshold, setThresholdState] = useState(5);
  const [thresholdDown, setThresholdDownState] = useState(5);
  const [cumulativeThreshold, setCumulativeThresholdState] = useState(15);
  const [streakFreezeDates, setStreakFreezeDatesState] = useState<string[]>([]);
  const [emailNotifications, setEmailNotificationsState] = useState(true);
  const [reflectionTone, setReflectionToneState] = useState('stoic');
  const [silentMode, setSilentModeState] = useState(false);
  const [cooldownHours, setCooldownHoursState] = useState(6);
  const [digestFrequency, setDigestFrequencyState] = useState('weekly');
  const [customPrompt, setCustomPromptState] = useState<string | null>(null);
  const [reflectionStyle, setReflectionStyleState] = useState('standard');
  const [quietHoursStart, setQuietHoursStartState] = useState<number | null>(null);
  const [quietHoursEnd, setQuietHoursEndState] = useState<number | null>(null);
  const [firstName, setFirstNameState] = useState<string | null>(null);
  const [aiInsightsEnabled, setAiInsightsEnabledState] = useState(true);
  const [ritualTemplate, setRitualTemplateState] = useState<string>('standard');
  const [nightReflectionHour, setNightReflectionHourState] = useState<number | null>(21);
  const [btcData, setBtcData] = useState<BtcPriceData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [companions, setCompanions] = useState<CompanionData>({ haiku: null, learningTitle: null, learningBody: null });
  const [companionPrefs, setCompanionPrefsState] = useState<CompanionPrefs>({ breathing: true, haiku: true, learning: true, signal: true, zoomOut: true, history: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newReflection, setNewReflection] = useState(false);
  const [lastReflectionId, setLastReflectionId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(true);

  // Load profile from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('threshold, threshold_down, cumulative_threshold, last_message, last_context, email_notifications, has_onboarded, companion_breathing, companion_haiku, companion_learning, companion_signal, companion_zoom_out, reflection_tone, cooldown_hours, last_trigger_at, silent_mode, streak_freeze_dates, digest_frequency, custom_prompt, reflection_style, quiet_hours_start, quiet_hours_end, first_name, night_reflection_hour, ai_insights_enabled, ritual_template')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setThresholdState(data.threshold);
        setThresholdDownState((data as any).threshold_down ?? data.threshold);
        setCumulativeThresholdState(data.cumulative_threshold ?? 15);
        setStreakFreezeDatesState((data as any).streak_freeze_dates ?? []);
        setLastTriggerAt((data as any).last_trigger_at ?? null);
        setMessage(data.last_message);
        setContext(data.last_context);
        setEmailNotificationsState(data.email_notifications ?? true);
        setReflectionToneState((data as any).reflection_tone ?? 'stoic');
        setCooldownHoursState((data as any).cooldown_hours ?? 6);
        setSilentModeState((data as any).silent_mode ?? false);
        setDigestFrequencyState((data as any).digest_frequency ?? 'weekly');
        setCustomPromptState((data as any).custom_prompt ?? null);
        setReflectionStyleState((data as any).reflection_style ?? 'standard');
        setQuietHoursStartState((data as any).quiet_hours_start ?? null);
        setQuietHoursEndState((data as any).quiet_hours_end ?? null);
        setFirstNameState((data as any).first_name ?? null);
        setNightReflectionHourState((data as any).night_reflection_hour ?? 21);
        setAiInsightsEnabledState((data as any).ai_insights_enabled ?? true);
        setRitualTemplateState((data as any).ritual_template ?? 'standard');
        setHasOnboarded(data.has_onboarded ?? false);
        setCompanionPrefsState({
          breathing: data.companion_breathing ?? true,
          haiku: data.companion_haiku ?? true,
          learning: data.companion_learning ?? true,
          signal: (data as any).companion_signal ?? true,
          zoomOut: (data as any).companion_zoom_out ?? true,
        });

        // Load companion data from latest reflection if there's an active message
        if (data.last_message) {
          const { data: latestReflection } = await supabase
            .from('reflections')
            .select('id, haiku, learning_title, learning_body')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (latestReflection) {
            setLastReflectionId(latestReflection.id);
            setCompanions({
              haiku: latestReflection.haiku ?? null,
              learningTitle: latestReflection.learning_title ?? null,
              learningBody: latestReflection.learning_body ?? null,
            });
          }
        }
      }
      setProfileLoaded(true);
    };
    load();
  }, [user]);

  const setThreshold = useCallback(async (val: number) => {
    setThresholdState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ threshold: val })
      .eq('user_id', user.id);
  }, [user]);

  const setThresholdDown = useCallback(async (val: number) => {
    setThresholdDownState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ threshold_down: val } as any)
      .eq('user_id', user.id);
  }, [user]);

  const setCumulativeThreshold = useCallback(async (val: number) => {
    setCumulativeThresholdState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ cumulative_threshold: val })
      .eq('user_id', user.id);
  }, [user]);

  const useStreakFreeze = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    if (streakFreezeDates.includes(today)) return; // already used today
    // Limit: max 1 freeze per 7 days
    const recent = streakFreezeDates.filter((d) => {
      const diff = Math.abs(Date.now() - new Date(d).getTime());
      return diff < 7 * 24 * 60 * 60 * 1000;
    });
    if (recent.length >= 1) return;
    const updated = [...streakFreezeDates, today];
    setStreakFreezeDatesState(updated);
    await supabase
      .from('profiles')
      .update({ streak_freeze_dates: updated } as any)
      .eq('user_id', user.id);
  }, [user, streakFreezeDates]);

  const setEmailNotifications = useCallback(async (val: boolean) => {
    setEmailNotificationsState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ email_notifications: val })
      .eq('user_id', user.id);
  }, [user]);

  const setReflectionTone = useCallback(async (val: string) => {
    setReflectionToneState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ reflection_tone: val } as any)
      .eq('user_id', user.id);
  }, [user]);

  const setSilentMode = useCallback(async (val: boolean) => {
    setSilentModeState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ silent_mode: val } as any)
      .eq('user_id', user.id);
  }, [user]);

  const setDigestFrequency = useCallback(async (val: string) => {
    setDigestFrequencyState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ digest_frequency: val } as any)
      .eq('user_id', user.id);
  }, [user]);

  const setCompanionPref = useCallback(async (key: keyof CompanionPrefs, val: boolean) => {
    setCompanionPrefsState((prev) => ({ ...prev, [key]: val }));
    if (!user) return;
    const snakeKey = key === 'zoomOut' ? 'zoom_out' : key;
    const dbKey = `companion_${snakeKey}` as string;
    await supabase
      .from('profiles')
      .update({ [dbKey]: val } as Record<string, boolean>)
      .eq('user_id', user.id);
  }, [user]);

  const completeOnboarding = useCallback(async (result: { threshold: number; firstName: string | null; timezone: string }) => {
    setHasOnboarded(true);
    setThresholdState(result.threshold);
    if (result.firstName) setFirstNameState(result.firstName);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({
        has_onboarded: true,
        threshold: result.threshold,
        first_name: result.firstName,
        timezone: result.timezone,
      } as any)
      .eq('user_id', user.id);
  }, [user]);

  const isInCooldown = useCallback(async () => {
    if (!user) return true;
    const { data } = await supabase
      .from('profiles')
      .select('last_trigger_at')
      .eq('user_id', user.id)
      .single();

    if (!data?.last_trigger_at) return false;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    return Date.now() - new Date(data.last_trigger_at).getTime() < cooldownMs;
  }, [user, cooldownHours]);

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

    // Silent mode: skip AI, just show context
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

      if (insertedReflection) setLastReflectionId(insertedReflection.id);

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

    // Fetch recent mood history for adaptive tone
    let moodHistory: { mood: string; outcome: string | null; created_at: string }[] = [];
    try {
      const { data: recentMoods } = await supabase
        .from('reflections')
        .select('mood, outcome, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      moodHistory = (recentMoods ?? [])
        .filter((r: any) => r.mood)
        .map((r: any) => ({ mood: r.mood, outcome: r.outcome, created_at: r.created_at }));
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

        // Save to history and update profile
        const { data: insertedReflection } = await supabase.from('reflections').insert({
          user_id: user.id,
          message: msg,
          context: ctx,
          haiku: companionData.haiku,
          learning_title: companionData.learningTitle,
          learning_body: companionData.learningBody,
          ...(mood ? { mood } : {}),
        }).select('id').single();

        if (insertedReflection) {
          setLastReflectionId(insertedReflection.id);
        }

        await supabase.from('profiles').update({
          last_message: msg,
          last_context: ctx,
          last_trigger_at: new Date().toISOString(),
        }).eq('user_id', user.id);

        setLastTriggerAt(new Date().toISOString());
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate message');
    } finally {
      setLoading(false);
    }
  }, [user, reflectionTone, reflectionStyle, silentMode, cumulativeThreshold, customPrompt]);

  const isInQuietHours = useCallback(() => {
    if (quietHoursStart === null || quietHoursEnd === null) return false;
    const nowHour = new Date().getHours();
    if (quietHoursStart <= quietHoursEnd) {
      return nowHour >= quietHoursStart && nowHour < quietHoursEnd;
    }
    // Wraps midnight (e.g., 22-7)
    return nowHour >= quietHoursStart || nowHour < quietHoursEnd;
  }, [quietHoursStart, quietHoursEnd]);

  const checkAndTrigger = useCallback(async () => {
    try {
      const data = await fetchBtcData();
      setBtcData(data);

      if (user && !(await isInCooldown()) && !isInQuietHours()) {
        const effectiveThreshold = data.changePercent < 0 ? thresholdDown : threshold;
        const dailyTriggered = Math.abs(data.changePercent) >= effectiveThreshold;
        const cumulativeTriggered = data.cumulativeChangePercent !== undefined && Math.abs(data.cumulativeChangePercent) >= cumulativeThreshold;

        if (dailyTriggered || cumulativeTriggered) {
          await generateMessage(data);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch BTC data');
    }
  }, [user, threshold, thresholdDown, cumulativeThreshold, isInCooldown, isInQuietHours, generateMessage]);

  const [lastTriggerAt, setLastTriggerAt] = useState<string | null>(null);
  const [lastManualAt, setLastManualAt] = useState<number | null>(() => {
    const stored = localStorage.getItem('holzen_last_manual_at');
    return stored ? Number(stored) : null;
  });

  const manualCooldownRemaining = useCallback(() => {
    if (!lastManualAt) return 0;
    const elapsed = Date.now() - lastManualAt;
    return Math.max(0, MANUAL_COOLDOWN_MS - elapsed);
  }, [lastManualAt]);

  const autoCooldownRemaining = useCallback(() => {
    if (!lastTriggerAt) return 0;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(lastTriggerAt).getTime();
    return Math.max(0, cooldownMs - elapsed);
  }, [lastTriggerAt, cooldownHours]);

  const manualTrigger = useCallback(async (mood?: string) => {
    const remaining = manualCooldownRemaining();
    if (remaining > 0) return;

    const now = Date.now();
    setLastManualAt(now);
    localStorage.setItem('holzen_last_manual_at', String(now));
    try {
      const data = btcData || await fetchBtcData();
      if (!btcData) setBtcData(data);
      await generateMessage(data, mood);
    } catch (e: any) {
      setError(e.message || 'Failed to trigger reflection');
    }
  }, [btcData, generateMessage, manualCooldownRemaining]);

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

  // Compute severity from btcData
  const severity: 'mild' | 'moderate' | 'high' = btcData
    ? Math.abs(btcData.changePercent) >= 10 ? 'high'
      : Math.abs(btcData.changePercent) >= 5 ? 'moderate'
      : 'mild'
    : 'mild';

  // Fetch BTC data on load and periodically
  useEffect(() => {
    if (!profileLoaded) return;
    checkAndTrigger();
    const interval = setInterval(checkAndTrigger, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndTrigger, profileLoaded]);

  const setCooldownHours = useCallback(async (val: number) => {
    setCooldownHoursState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ cooldown_hours: val } as any)
      .eq('user_id', user.id);
  }, [user]);

  return {
    threshold,
    setThreshold,
    thresholdDown,
    setThresholdDown,
    cumulativeThreshold,
    setCumulativeThreshold,
    streakFreezeDates,
    useStreakFreeze,
    emailNotifications,
    setEmailNotifications,
    reflectionTone,
    setReflectionTone,
    silentMode,
    setSilentMode,
    cooldownHours,
    setCooldownHours,
    digestFrequency,
    setDigestFrequency,
    customPrompt,
    setCustomPrompt: async (val: string | null) => {
      setCustomPromptState(val);
      if (!user) return;
      await supabase.from('profiles').update({ custom_prompt: val } as any).eq('user_id', user.id);
    },
    reflectionStyle,
    setReflectionStyle: async (val: string) => {
      setReflectionStyleState(val);
      if (!user) return;
      await supabase.from('profiles').update({ reflection_style: val } as any).eq('user_id', user.id);
    },
    quietHoursStart,
    quietHoursEnd,
    setQuietHours: async (start: number | null, end: number | null) => {
      setQuietHoursStartState(start);
      setQuietHoursEndState(end);
      if (!user) return;
      await supabase.from('profiles').update({ quiet_hours_start: start, quiet_hours_end: end } as any).eq('user_id', user.id);
    },
    nightReflectionHour,
    setNightReflectionHour: async (val: number | null) => {
      setNightReflectionHourState(val);
      if (!user) return;
      await supabase.from('profiles').update({ night_reflection_hour: val } as any).eq('user_id', user.id);
    },
    firstName,
    setFirstName: async (val: string | null) => {
      setFirstNameState(val);
      if (!user) return;
      await supabase.from('profiles').update({ first_name: val } as any).eq('user_id', user.id);
    },
    aiInsightsEnabled,
    setAiInsightsEnabled: async (val: boolean) => {
      setAiInsightsEnabledState(val);
      if (!user) return;
      await supabase.from('profiles').update({ ai_insights_enabled: val } as any).eq('user_id', user.id);
    },
    ritualTemplate,
    setRitualTemplate: async (val: string) => {
      setRitualTemplateState(val);
      if (!user) return;
      await supabase.from('profiles').update({ ritual_template: val } as any).eq('user_id', user.id);
    },
    companionPrefs,
    setCompanionPref,
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
    hasOnboarded,
    completeOnboarding,
    manualTrigger,
    manualCooldownRemaining,
    autoCooldownRemaining,
    profileLoaded,
  };
}
