import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

const FREE_TRIAL_COUNT = 3;

export function useSubscription() {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [trialRemaining, setTrialRemaining] = useState<number | undefined>(undefined);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscribed(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;

      if (data?.subscribed) {
        setSubscribed(true);
        setTrialRemaining(undefined);
      } else {
        setSubscribed(false);
        // Count reflections for trial
        const { count } = await supabase
          .from('reflections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const used = count ?? 0;
        setTrialRemaining(Math.max(0, FREE_TRIAL_COUNT - used));
      }
    } catch {
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60 * 1000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const startCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (e) {
      console.error('Checkout error:', e);
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (e) {
      console.error('Portal error:', e);
    }
  }, []);

  return { subscribed, loading, checkoutLoading, startCheckout, openPortal, refresh: checkSubscription, trialRemaining };
}
