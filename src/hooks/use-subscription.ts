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
  tier: 'free' | 'pro' | 'pro_plus' | 'lifetime';
  monthlyUsed: number;
  monthlyRemaining: number | undefined;
  companionLimit: number;
  companionUsed: number;
  companionRemaining: number;
  wallpaperLimit: number;
  wallpaperUsed: number;
  wallpaperRemaining: number;
  insightsLimit: number;
  insightsUsed: number;
  insightsRemaining: number;
  flexCreditsBalance: number;
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
  tier: 'free' | 'pro' | 'pro_plus' | 'lifetime';
  monthlyUsed: number;
  monthlyRemaining: number | undefined;
  companionLimit: number;
  companionUsed: number;
  companionRemaining: number;
  wallpaperLimit: number;
  wallpaperUsed: number;
  wallpaperRemaining: number;
  insightsLimit: number;
  insightsUsed: number;
  insightsRemaining: number;
  flexCreditsBalance: number;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
  trialStart: string | null;
  trialEnd: string | null;
};

async function fetchSubscriptionSnapshot(userId: string, force: boolean): Promise<SubscriptionSnapshot> {
  const { data, error } = await supabase.functions.invoke('check-subscription', {
    body: force ? { force: true } : undefined,
  });
  if (error) throw error;
  const apiFlexCreditsBalance = Number(data?.flex_credits_balance) || 0;

  if (data?.subscribed) {
    const tier = (data.tier as SubscriptionSnapshot['tier']) || 'pro';
    const companionLimit = Number(data.monthly_companion_limit) || 0;
    const companionUsed = Number(data.monthly_companion_used) || 0;
    const companionRemaining = Math.max(0, Number(data.monthly_companion_remaining) || 0);
    const wallpaperLimit = Number(data.monthly_wallpaper_limit) || 0;
    const wallpaperUsed = Number(data.monthly_wallpaper_used) || 0;
    const wallpaperRemaining = Math.max(0, Number(data.monthly_wallpaper_remaining) || 0);
    const insightsLimit = Number(data.monthly_insights_limit) || 0;
    const insightsUsed = Number(data.monthly_insights_used) || 0;
    const insightsRemaining = Math.max(0, Number(data.monthly_insights_remaining) || 0);
    const flexCreditsBalance = Number(data.flex_credits_balance) || 0;
    const subscriptionStatus = (data.subscription_status as string) ?? null;
    const subscriptionEnd = (data.subscription_end as string) ?? null;
    const trialStart = (data.trial_start as string) ?? null;
    const trialEnd = (data.trial_end as string) ?? null;
    writeSubCache({
      subscribed: true,
      tier,
      monthlyUsed: 0,
      monthlyRemaining: undefined,
      companionLimit,
      companionUsed,
      companionRemaining,
      wallpaperLimit,
      wallpaperUsed,
      wallpaperRemaining,
      insightsLimit,
      insightsUsed,
      insightsRemaining,
      flexCreditsBalance,
      ts: Date.now(),
    });
    return {
      subscribed: true,
      tier,
      monthlyUsed: 0,
      monthlyRemaining: undefined,
      companionLimit,
      companionUsed,
      companionRemaining,
      wallpaperLimit,
      wallpaperUsed,
      wallpaperRemaining,
      insightsLimit,
      insightsUsed,
      insightsRemaining,
      flexCreditsBalance,
      subscriptionStatus,
      subscriptionEnd,
      trialStart,
      trialEnd,
    };
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
    tier: 'free',
    monthlyUsed: used,
    monthlyRemaining: remaining,
    companionLimit: 0,
    companionUsed: 0,
    companionRemaining: 0,
    wallpaperLimit: 0,
    wallpaperUsed: 0,
    wallpaperRemaining: 0,
    insightsLimit: 0,
    insightsUsed: 0,
    insightsRemaining: 0,
    flexCreditsBalance: apiFlexCreditsBalance,
    ts: Date.now(),
  });
  return {
    subscribed: false,
    tier: 'free',
    monthlyUsed: used,
    monthlyRemaining: remaining,
    companionLimit: 0,
    companionUsed: 0,
    companionRemaining: 0,
    wallpaperLimit: 0,
    wallpaperUsed: 0,
    wallpaperRemaining: 0,
    insightsLimit: 0,
    insightsUsed: 0,
    insightsRemaining: 0,
    flexCreditsBalance: apiFlexCreditsBalance,
  };
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
          tier: cacheFallback.tier,
          monthlyUsed: cacheFallback.monthlyUsed,
          monthlyRemaining: cacheFallback.monthlyRemaining,
          companionLimit: cacheFallback.companionLimit,
          companionUsed: cacheFallback.companionUsed,
          companionRemaining: cacheFallback.companionRemaining,
          wallpaperLimit: cacheFallback.wallpaperLimit,
          wallpaperUsed: cacheFallback.wallpaperUsed,
          wallpaperRemaining: cacheFallback.wallpaperRemaining,
          insightsLimit: cacheFallback.insightsLimit,
          insightsUsed: cacheFallback.insightsUsed,
          insightsRemaining: cacheFallback.insightsRemaining,
          flexCreditsBalance: cacheFallback.flexCreditsBalance,
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
  const tier = effectiveSnapshot?.tier ?? 'free';
  const monthlyUsed = effectiveSnapshot?.monthlyUsed ?? 0;
  const monthlyRemaining = effectiveSnapshot?.monthlyRemaining;
  const companionLimit = effectiveSnapshot?.companionLimit ?? 0;
  const companionUsed = effectiveSnapshot?.companionUsed ?? 0;
  const companionRemaining = effectiveSnapshot?.companionRemaining ?? 0;
  const wallpaperLimit = effectiveSnapshot?.wallpaperLimit ?? 0;
  const wallpaperUsed = effectiveSnapshot?.wallpaperUsed ?? 0;
  const wallpaperRemaining = effectiveSnapshot?.wallpaperRemaining ?? 0;
  const insightsLimit = effectiveSnapshot?.insightsLimit ?? 0;
  const insightsUsed = effectiveSnapshot?.insightsUsed ?? 0;
  const insightsRemaining = effectiveSnapshot?.insightsRemaining ?? 0;
  const flexCreditsBalance = effectiveSnapshot?.flexCreditsBalance ?? 0;
  const loading = !!userId && query.isLoading && !query.data;

  useEffect(() => {
    if (loading) return;
    const next = { subscribed, monthlyRemaining };
    const prev = lastLoggedSubRef.current;
    if (prev && prev.subscribed === next.subscribed && prev.monthlyRemaining === next.monthlyRemaining) return;
    lastLoggedSubRef.current = next;
    holzenLog.subscription('state', {
      subscribed,
      tier,
      monthlyRemaining,
      monthlyUsed,
      companionRemaining,
      wallpaperRemaining,
      insightsRemaining,
      flexCreditsBalance,
    });
  }, [loading, subscribed, tier, monthlyRemaining, monthlyUsed, companionRemaining, wallpaperRemaining, insightsRemaining, flexCreditsBalance]);

  const startCheckout = useCallback(async (target: 'pro' | 'pro_plus' | 'flex_pack_s' | 'flex_pack_m' = 'pro') => {
    holzenLog.subscription('checkout', { action: 'start', target });
    setCheckoutLoading(true);
    try {
      sessionStorage.setItem(CHECKOUT_RETURN_KEY, String(Date.now()));
      const isPack = target === 'flex_pack_s' || target === 'flex_pack_m';
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: isPack
          ? { checkoutKind: target }
          : { checkoutKind: 'subscription', planTier: target },
      });
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
      tier: 'free',
      companionLimit: 0,
      companionUsed: 0,
      companionRemaining: 0,
      wallpaperLimit: 0,
      wallpaperUsed: 0,
      wallpaperRemaining: 0,
      insightsLimit: 0,
      insightsUsed: 0,
      insightsRemaining: 0,
      flexCreditsBalance: 0,
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
    tier,
    companionLimit,
    companionUsed,
    companionRemaining,
    wallpaperLimit,
    wallpaperUsed,
    wallpaperRemaining,
    insightsLimit,
    insightsUsed,
    insightsRemaining,
    flexCreditsBalance,
    canReflect,
  };
}
