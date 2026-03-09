import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { PRICING } from '@/lib/pricing';

const FREE_MONTHLY_LIMIT = PRICING.freeReflectionsPerMonth;

export function useSubscription() {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [monthlyUsed, setMonthlyUsed] = useState(0);
  const [monthlyRemaining, setMonthlyRemaining] = useState<number | undefined>(undefined);

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
        setMonthlyRemaining(undefined);
      } else {
        setSubscribed(false);
        // Count reflections this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const { count } = await supabase
          .from('reflections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', monthStart);

        const used = count ?? 0;
        setMonthlyUsed(used);
        setMonthlyRemaining(Math.max(0, FREE_MONTHLY_LIMIT - used));
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

  /** Whether the user can create a new reflection (subscribed OR has free reflections left) */
  const canReflect = subscribed || (monthlyRemaining !== undefined && monthlyRemaining > 0);

  return {
    subscribed,
    loading,
    checkoutLoading,
    startCheckout,
    openPortal,
    refresh: checkSubscription,
    monthlyRemaining,
    monthlyUsed,
    canReflect,
  };
}
