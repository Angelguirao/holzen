import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { PRICING } from '@/lib/pricing';

const FREE_MONTHLY_LIMIT = PRICING.freeReflectionsPerMonth;
const CHECKOUT_RETURN_KEY = 'holzen_checkout_started_at';
const CHECKOUT_RETURN_WINDOW_MS = 30 * 60 * 1000;
const SUB_CACHE_KEY = 'holzen_sub_cache';

interface SubCache {
  subscribed: boolean;
  monthlyUsed: number;
  monthlyRemaining: number | undefined;
  ts: number;
}

function readSubCache(): SubCache | null {
  try {
    const raw = localStorage.getItem(SUB_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SubCache;
  } catch { return null; }
}

function writeSubCache(c: SubCache) {
  try { localStorage.setItem(SUB_CACHE_KEY, JSON.stringify(c)); } catch {}
}

export function useSubscription() {
  const { user } = useAuth();
  const cached = readSubCache();
  const [subscribed, setSubscribed] = useState(cached?.subscribed ?? false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [monthlyUsed, setMonthlyUsed] = useState(cached?.monthlyUsed ?? 0);
  const [monthlyRemaining, setMonthlyRemaining] = useState<number | undefined>(cached?.monthlyRemaining);

  const checkSubscription = useCallback(async (force = false) => {
    if (!user) {
      setSubscribed(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: force ? { force: true } : undefined,
      });
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
        const remaining = Math.max(0, FREE_MONTHLY_LIMIT - used);
        setMonthlyRemaining(remaining);
      }
    } catch {
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasCheckoutQuery = params.get('subscribed') === 'true';
    const checkoutStartedAt = Number(sessionStorage.getItem(CHECKOUT_RETURN_KEY) ?? 0);
    const returnedFromRecentCheckout = checkoutStartedAt > 0 && (Date.now() - checkoutStartedAt) < CHECKOUT_RETURN_WINDOW_MS;
    const shouldForce = hasCheckoutQuery || returnedFromRecentCheckout;

    if (shouldForce) {
      sessionStorage.removeItem(CHECKOUT_RETURN_KEY);
    }

    checkSubscription(shouldForce);

    // Poll every 5 minutes — cache handles freshness
    const interval = setInterval(() => checkSubscription(), 5 * 60 * 1000);
    // Force-refresh when tab regains focus (e.g. returning from checkout)
    const onFocus = () => checkSubscription(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkSubscription]);

  const startCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      sessionStorage.setItem(CHECKOUT_RETURN_KEY, String(Date.now()));
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;

      if (data?.url) {
        const checkoutUrl = data.url as string;

        // In embedded previews, Stripe cannot render in-frame.
        // Try top-level navigation first, then fall back to same-frame.
        try {
          if (window.self !== window.top && window.top) {
            window.top.location.href = checkoutUrl;
          } else {
            window.location.href = checkoutUrl;
          }
        } catch {
          window.location.href = checkoutUrl;
        }
        return;
      }

      setCheckoutLoading(false);
    } catch (e) {
      console.error('Checkout error:', e);
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
    refresh: () => checkSubscription(true),
    monthlyRemaining,
    monthlyUsed,
    canReflect,
  };
}