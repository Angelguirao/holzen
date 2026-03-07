import { useState, useEffect, useCallback } from 'react';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';

const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours
const MANUAL_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes for on-demand

export function useHolzen() {
  const { user } = useAuth();
  const [threshold, setThresholdState] = useState(5);
  const [cumulativeThreshold, setCumulativeThresholdState] = useState(15);
  const [emailNotifications, setEmailNotificationsState] = useState(true);
  const [reflectionTone, setReflectionToneState] = useState('stoic');
  const [btcData, setBtcData] = useState<BtcPriceData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [companions, setCompanions] = useState<CompanionData>({ haiku: null, learningTitle: null, learningBody: null });
  const [companionPrefs, setCompanionPrefsState] = useState<CompanionPrefs>({ breathing: true, haiku: true, learning: true });
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
        .select('threshold, cumulative_threshold, last_message, last_context, email_notifications, has_onboarded, companion_breathing, companion_haiku, companion_learning')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setThresholdState(data.threshold);
        setCumulativeThresholdState(data.cumulative_threshold ?? 15);
        setMessage(data.last_message);
        setContext(data.last_context);
        setEmailNotificationsState(data.email_notifications ?? true);
        setHasOnboarded(data.has_onboarded ?? false);
        setCompanionPrefsState({
          breathing: data.companion_breathing ?? true,
          haiku: data.companion_haiku ?? true,
          learning: data.companion_learning ?? true,
        });

        // Load companion data from latest reflection if there's an active message
        if (data.last_message) {
          const { data: latestReflection } = await supabase
            .from('reflections')
            .select('haiku, learning_title, learning_body')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (latestReflection) {
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

  const setCumulativeThreshold = useCallback(async (val: number) => {
    setCumulativeThresholdState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ cumulative_threshold: val })
      .eq('user_id', user.id);
  }, [user]);

  const setEmailNotifications = useCallback(async (val: boolean) => {
    setEmailNotificationsState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ email_notifications: val })
      .eq('user_id', user.id);
  }, [user]);

  const setCompanionPref = useCallback(async (key: keyof CompanionPrefs, val: boolean) => {
    setCompanionPrefsState((prev) => ({ ...prev, [key]: val }));
    if (!user) return;
    const dbKey = `companion_${key}` as string;
    await supabase
      .from('profiles')
      .update({ [dbKey]: val } as Record<string, boolean>)
      .eq('user_id', user.id);
  }, [user]);

  const completeOnboarding = useCallback(async (selectedThreshold: number) => {
    setHasOnboarded(true);
    setThresholdState(selectedThreshold);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ has_onboarded: true, threshold: selectedThreshold })
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
    return Date.now() - new Date(data.last_trigger_at).getTime() < COOLDOWN_MS;
  }, [user]);

  const generateMessage = useCallback(async (data: BtcPriceData, mood?: string) => {
    if (!user) return;
    const dir = data.direction === 'down' ? 'down' : 'up';
    const pct = Math.abs(data.changePercent).toFixed(1);
    let ctx = `BTC is ${dir} ${pct}% in the last 24 hours.`;
    if (data.cumulativeChangePercent !== undefined && Math.abs(data.cumulativeChangePercent) >= cumulativeThreshold) {
      const cumDir = data.cumulativeDirection === 'down' ? 'down' : 'up';
      ctx += ` Over 7 days, it's ${cumDir} ${Math.abs(data.cumulativeChangePercent).toFixed(1)}%.`;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('holzen-reflect', {
        body: { context: ctx },
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
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate message');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkAndTrigger = useCallback(async () => {
    try {
      const data = await fetchBtcData();
      setBtcData(data);

      if (user && !(await isInCooldown())) {
        const dailyTriggered = Math.abs(data.changePercent) >= threshold;
        const cumulativeTriggered = data.cumulativeChangePercent !== undefined && Math.abs(data.cumulativeChangePercent) >= cumulativeThreshold;

        if (dailyTriggered || cumulativeTriggered) {
          await generateMessage(data);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch BTC data');
    }
  }, [user, threshold, cumulativeThreshold, isInCooldown, generateMessage]);

  const [lastManualAt, setLastManualAt] = useState<number | null>(null);

  const manualCooldownRemaining = useCallback(() => {
    if (!lastManualAt) return 0;
    const elapsed = Date.now() - lastManualAt;
    return Math.max(0, MANUAL_COOLDOWN_MS - elapsed);
  }, [lastManualAt]);

  const manualTrigger = useCallback(async (mood?: string) => {
    const remaining = manualCooldownRemaining();
    if (remaining > 0) return;

    setLastManualAt(Date.now());
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

  return {
    threshold,
    setThreshold,
    cumulativeThreshold,
    setCumulativeThreshold,
    emailNotifications,
    setEmailNotifications,
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
  };
}
