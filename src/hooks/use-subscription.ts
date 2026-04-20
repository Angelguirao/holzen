import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { PRICING } from '@/lib/pricing';
import { holzenLog } from '@/lib/holzen-console';

const FREE_MONTHLY_LIMIT = PRICING.freeReflectionsPerMonth;
const CHECKOUT_RETURN_KEY = 'holzen_checkout_started_at';
const CHECKOUT_RETURN_WINDOW_MS = 30 * 60 * 1000;
const SUB_CACHE_KEY = 'holzen_sub_cache';

/** Next fetch uses `{ force: true }` on check-subscription (window focus, refresh(), etc.). */
let subscriptionForceNext = false;

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
  } catch {
    return null;
  }
}

function writeSubCache(c: SubCache) {
  try {
    localStorage.setItem(SUB_CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

function checkoutReturnWantsForce(): boolean {
  const params = new URLSearchParams(window.location.search);
  const hasCheckoutQuery = params.get('subscribed') === 'true';
  const checkoutStartedAt = Number(sessionStorage.getItem(CHECKOUT_RETURN_KEY) ?? 0);
  const returnedFromRecentCheckout =
    checkoutStartedAt > 0 && Date.now() - checkoutStartedAt < CHECKOUT_RETURN_WINDOW_MS;
  if (hasCheckoutQuery || returnedFromRecentCheckout) {
    sessionStorage.removeItem(CHECKOUT_RETURN_KEY);
    return true;
  }
  return false;
}

/** One checkout/return sweep per signed-in user id (matches previous mount-once behavior). */
const checkoutSweepDoneForUser = new Set<string>();

function consumeInitialCheckoutForce(userId: string): boolean {
  if (checkoutSweepDoneForUser.has(userId)) return false;
  checkoutSweepDoneForUser.add(userId);
  return checkoutReturnWantsForce();
}

type SubscriptionSnapshot = {
  subscribed: boolean;
  monthlyUsed: number;
  monthlyRemaining: number | undefined;
};

async function fetchSubscriptionSnapshot(userId: string, force: boolean): Promise<SubscriptionSnapshot> {
  const { data, error } = await supabase.functions.invoke('check-subscription', {
    body: force ? { force: true } : undefined,
  });
  if (error) throw error;

  if (data?.subscribed) {
    writeSubCache({
      subscribed: true,
      monthlyUsed: 0,
      monthlyRemaining: undefined,
      ts: Date.now(),
    });
    return { subscribed: true, monthlyUsed: 0, monthlyRemaining: undefined };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  // Only full-ritual pauses count toward the free-tier monthly quota:
  // breathing completed AND mood/mood_after/outcome set. Ignored notifications
  // (rows that were merely generated) don't burn quota, and neither do
  // quick decision-only taps — this is the anti-gaming quota gate.
  const { data: rows } = await supabase
    .from('reflections')
    .select('breathing_completed, mood, mood_after, outcome')
    .eq('user_id', userId)
    .gte('created_at', monthStart);

  const { isFullRitualPause } = await import('@/lib/engaged-pause');
  const used = (rows ?? []).filter(isFullRitualPause).length;
  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - used);
  writeSubCache({
    subscribed: false,
    monthlyUsed: used,
    monthlyRemaining: remaining,
    ts: Date.now(),
  });
  return { subscribed: false, monthlyUsed: used, monthlyRemaining: remaining };
}

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const lastLoggedSubRef = useRef<{ subscribed: boolean; monthlyRemaining: number | undefined } | null>(null);

  const query = useQuery({
    queryKey: ['subscription', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: userId ? 5 * 60 * 1000 : false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
    queryFn: async () => {
      let force = subscriptionForceNext;
      subscriptionForceNext = false;
      if (!force) {
        force = consumeInitialCheckoutForce(userId!);
      }
      return fetchSubscriptionSnapshot(userId!, force);
    },
  });

  const cacheFallback = readSubCache();
  const effectiveSnapshot =
    query.data ??
    (cacheFallback
      ? {
          subscribed: cacheFallback.subscribed,
          monthlyUsed: cacheFallback.monthlyUsed,
          monthlyRemaining: cacheFallback.monthlyRemaining,
        }
      : undefined);

  useEffect(() => {
    if (!userId) return;
    const onFocus = () => {
      subscriptionForceNext = true;
      void queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [userId, queryClient]);

  const subscribed = effectiveSnapshot?.subscribed ?? false;
  const monthlyUsed = effectiveSnapshot?.monthlyUsed ?? 0;
  const monthlyRemaining = effectiveSnapshot?.monthlyRemaining;
  const loading = !!userId && query.isLoading && !query.data;

  useEffect(() => {
    if (loading) return;
    const next = { subscribed, monthlyRemaining };
    const prev = lastLoggedSubRef.current;
    if (prev && prev.subscribed === next.subscribed && prev.monthlyRemaining === next.monthlyRemaining) return;
    lastLoggedSubRef.current = next;
    holzenLog.subscription('state', {
      subscribed,
      monthlyRemaining,
      monthlyUsed,
    });
  }, [loading, subscribed, monthlyRemaining, monthlyUsed]);

  const startCheckout = useCallback(async () => {
    holzenLog.subscription('checkout', { action: 'start' });
    setCheckoutLoading(true);
    try {
      sessionStorage.setItem(CHECKOUT_RETURN_KEY, String(Date.now()));
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;

      if (data?.url) {
        const checkoutUrl = data.url as string;

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
    holzenLog.subscription('portal', { action: 'open' });
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

  const refresh = useCallback(() => {
    if (!userId) return Promise.resolve();
    subscriptionForceNext = true;
    return queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
  }, [userId, queryClient]);

  const canReflect =
    !userId ? false : subscribed || (monthlyRemaining !== undefined && monthlyRemaining > 0);

  if (!userId) {
    return {
      subscribed: false,
      loading: false,
      checkoutLoading,
      startCheckout,
      openPortal,
      refresh,
      monthlyRemaining: undefined,
      monthlyUsed: 0,
      canReflect: false,
    };
  }

  return {
    subscribed,
    loading,
    checkoutLoading,
    startCheckout,
    openPortal,
    refresh,
    monthlyRemaining,
    monthlyUsed,
    canReflect,
  };
}
