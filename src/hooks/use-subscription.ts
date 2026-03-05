import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export function useSubscription() {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscribed(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscribed(data?.subscribed ?? false);
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

  return { subscribed, loading, checkoutLoading, startCheckout, openPortal, refresh: checkSubscription };
}
