import { useState, useEffect, useCallback } from 'react';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

export function useHolzen() {
  const { user } = useAuth();
  const [threshold, setThresholdState] = useState(5);
  const [emailNotifications, setEmailNotificationsState] = useState(true);
  const [btcData, setBtcData] = useState<BtcPriceData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newReflection, setNewReflection] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(true);

  // Load profile from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('threshold, last_message, last_context, last_trigger_at, email_notifications, has_onboarded')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setThresholdState(data.threshold);
        setMessage(data.last_message);
        setContext(data.last_context);
        setEmailNotificationsState(data.email_notifications ?? true);
        setHasOnboarded(data.has_onboarded ?? false);
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

  const setEmailNotifications = useCallback(async (val: boolean) => {
    setEmailNotificationsState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ email_notifications: val })
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

  const generateMessage = useCallback(async (data: BtcPriceData) => {
    if (!user) return;
    const dir = data.direction === 'down' ? 'down' : 'up';
    const pct = Math.abs(data.changePercent).toFixed(1);
    const ctx = `BTC is ${dir} ${pct}% in the last 24 hours.`;

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

        // Save to history and update profile
        await Promise.all([
          supabase.from('reflections').insert({ user_id: user.id, message: msg, context: ctx }),
          supabase.from('profiles').update({
            last_message: msg,
            last_context: ctx,
            last_trigger_at: new Date().toISOString(),
          }).eq('user_id', user.id),
        ]);
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

      if (user && Math.abs(data.changePercent) >= threshold && !(await isInCooldown())) {
        await generateMessage(data);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch BTC data');
    }
  }, [user, threshold, isInCooldown, generateMessage]);

  const manualTrigger = useCallback(async () => {
    try {
      const data = btcData || await fetchBtcData();
      if (!btcData) setBtcData(data);
      await generateMessage(data);
    } catch (e: any) {
      setError(e.message || 'Failed to trigger reflection');
    }
  }, [btcData, generateMessage]);

  const dismissMessage = useCallback(async () => {
    setMessage(null);
    setContext(null);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ last_message: null, last_context: null })
      .eq('user_id', user.id);
  }, [user]);

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
    emailNotifications,
    setEmailNotifications,
    btcData,
    message,
    context,
    loading,
    error,
    newReflection,
    clearNewReflection: () => setNewReflection(false),
    dismissMessage,
    hasOnboarded,
    completeOnboarding,
    manualTrigger,
  };
}
