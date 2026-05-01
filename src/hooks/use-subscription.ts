import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { PRICING } from '@/lib/pricing';
import { holzenLog } from '@/lib/holzen-console';
import { getCheckoutSuppressionWindowMs } from '@/lib/checkout-suppression-window';

const FREE_MONTHLY_LIMIT = PRICING.freeReflectionsPerMonth;
const CHECKOUT_RETURN_KEY = 'holzen_checkout_started_at';
/** Set when a checkout return includes `?subscribed=true` (timestamp for PaywallSubscribedTracker TTL) */
export const POST_CHECKOUT_SUBSCRIBE_FLAG = 'holzen_post_checkout_subscribe';
const SUB_CACHE_KEY = 'holzen_sub_cache';

/** Next fetch uses `{ force: true }` on check-subscription (window focus, refresh(), etc.). */
let subscriptionForceNext = false;

/**
 * Trigger source for the next subscription fetch. Lets us prove in logs whether
 * a `check-subscription` call came from the user's explicit Refresh button
 * (`manual_retry`) vs. the initial mount, focus, or interval refetch — so we
 * can verify back-navigation / param stripping never invokes `manual_retry`.
 */
type SubFetchSource = 'mount' | 'manual_retry' | 'focus' | 'interval' | 'invalidate';
let subscriptionNextFetchSource: SubFetchSource | null = null;

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
    checkoutStartedAt > 0 && Date.now() - checkoutStartedAt < getCheckoutSuppressionWindowMs();
  if (hasCheckoutQuery || returnedFromRecentCheckout) {
    if (hasCheckoutQuery) {
      try {
        sessionStorage.setItem(POST_CHECKOUT_SUBSCRIBE_FLAG, String(Date.now()));
      } catch {
        /* ignore */
      }
    }
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

export type SubscriptionBillingInterval = 'month' | 'year' | 'day' | 'week';

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
  /** From Stripe `price.recurring.interval` (fresh `check-subscription` only) */
  subscriptionBillingInterval: SubscriptionBillingInterval | null;
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
    const bi = (data as { subscription_billing_interval?: unknown }).subscription_billing_interval;
    const subscriptionBillingInterval: SubscriptionBillingInterval | null =
      bi === 'month' || bi === 'year' || bi === 'day' || bi === 'week' ? bi : null;
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
      subscriptionBillingInterval,
    };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  // Free-tier monthly quota: count completed pauses in the current month.
  // Completion requires strict full ritual (breath + initial/shift mood +
  // outcome + counted companion) — enforced by the pause state machine.
  const { data: rows } = await supabase
    .from('pause_instances' as never)
    .select('id')
    .eq('user_id', userId)
    .eq('state', 'completed')
    .gte('created_at', monthStart);

  const used = (rows ?? []).length;
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
    subscriptionStatus: null,
    subscriptionEnd: null,
    trialStart: null,
    trialEnd: null,
    subscriptionBillingInterval: null,
  };
}

export function useSubscription() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutLoadingTarget, setCheckoutLoadingTarget] = useState<
    'pro' | 'pro_plus' | 'flex_pack_s' | 'flex_pack_m' | null
  >(null);
  const lastLoggedSubRef = useRef<{ subscribed: boolean; monthlyRemaining: number | undefined } | null>(null);

  const query = useQuery({
    queryKey: ['subscription', userId],
    enabled: !!userId,
    // Tightened from 5min → 30s so credit changes (regenerate, wallpaper,
    // insights) reconcile within the same interaction window even if a
    // call site forgets to invalidate. Optimistic decrement still gives
    // an instant UI; this is the safety net.
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: userId ? 60 * 1000 : false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
    queryFn: async () => {
      let force = subscriptionForceNext;
      subscriptionForceNext = false;
      // Initial mount = no explicit source set yet AND no cached query data.
      const source: SubFetchSource =
        subscriptionNextFetchSource ??
        (queryClient.getQueryData(['subscription', userId]) ? 'interval' : 'mount');
      subscriptionNextFetchSource = null;
      if (!force) {
        force = consumeInitialCheckoutForce(userId!);
      }
      holzenLog.subscription('fetch', { source, force });
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
          subscriptionStatus: null,
          subscriptionEnd: null,
          trialStart: null,
          trialEnd: null,
          subscriptionBillingInterval: null,
        }
      : undefined);

  useEffect(() => {
    if (!userId) return;
    const onFocus = () => {
      subscriptionForceNext = true;
      subscriptionNextFetchSource = 'focus';
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
  const subscriptionStatus = effectiveSnapshot?.subscriptionStatus ?? null;
  const subscriptionEnd = effectiveSnapshot?.subscriptionEnd ?? null;
  const trialStart = effectiveSnapshot?.trialStart ?? null;
  const trialEnd = effectiveSnapshot?.trialEnd ?? null;
  const subscriptionBillingInterval = effectiveSnapshot?.subscriptionBillingInterval ?? null;
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
    setCheckoutLoadingTarget(target);
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

      toast.error(t('home.subscription.checkoutNoUrl'));
      setCheckoutLoading(false);
      setCheckoutLoadingTarget(null);
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error(t('home.subscription.checkoutFailed'));
      setCheckoutLoading(false);
      setCheckoutLoadingTarget(null);
    }
  }, [t]);

  const openPortal = useCallback(async () => {
    holzenLog.subscription('portal', { action: 'open' });
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        return;
      }
      toast.error(t('home.subscription.portalNoUrl'));
    } catch (e) {
      console.error('Portal error:', e);
      toast.error(t('home.subscription.portalFailed'));
    }
  }, [t]);

  /**
   * Programmatic invalidation used by code paths *other* than the user's
   * explicit Refresh button (e.g. after a successful checkout, after spending
   * a credit). Tagged `invalidate` in logs.
   *
   * **Do not** call this from focus, visibility, route, or URL-param handlers
   * — those have their own dedicated source tags (or should not call at all).
   */
  const refresh = useCallback(() => {
    if (!userId) return Promise.resolve();
    subscriptionForceNext = true;
    subscriptionNextFetchSource = 'invalidate';
    return queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
  }, [userId, queryClient]);

  /**
   * Dedicated path for the user-visible Retry / Refresh button in the
   * Credits Dashboard. Tagged `manual_retry` in logs so we can grep and
   * confirm back-navigation / param stripping never trips this code path.
   */
  const manualRetry = useCallback(() => {
    if (!userId) return Promise.resolve();
    subscriptionForceNext = true;
    subscriptionNextFetchSource = 'manual_retry';
    holzenLog.subscription('manual_retry', { trigger: 'user_click' });
    return queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
  }, [userId, queryClient]);

  /**
   * Optimistically decrement a feature counter (and/or flex credits) in the
   * cached subscription snapshot so the UI reflects the spend instantly.
   * The next `refresh()` reconciles with the server. Safe to call before the
   * action — if the action fails, just call `refresh()` to roll back.
   */
  const applyOptimisticDecrement = useCallback(
    (feature: 'companion' | 'wallpaper' | 'insight', amount = 1) => {
      if (!userId) return;
      queryClient.setQueryData<SubscriptionSnapshot | undefined>(
        ['subscription', userId],
        (prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          // Pro/Pro+ users spend the monthly bucket first.
          if (feature === 'companion' && next.companionRemaining > 0) {
            next.companionRemaining = Math.max(0, next.companionRemaining - amount);
            next.companionUsed = next.companionUsed + amount;
          } else if (feature === 'wallpaper' && next.wallpaperRemaining > 0) {
            next.wallpaperRemaining = Math.max(0, next.wallpaperRemaining - amount);
            next.wallpaperUsed = next.wallpaperUsed + amount;
          } else if (feature === 'insight' && next.insightsRemaining > 0) {
            next.insightsRemaining = Math.max(0, next.insightsRemaining - amount);
            next.insightsUsed = next.insightsUsed + amount;
          } else {
            // Bucket empty → spend a flex credit instead.
            next.flexCreditsBalance = Math.max(0, next.flexCreditsBalance - amount);
          }
          return next;
        },
      );
    },
    [userId, queryClient],
  );

  const canReflect =
    !userId ? false : subscribed || (monthlyRemaining !== undefined && monthlyRemaining > 0);

  if (!userId) {
    return {
      subscribed: false,
      loading: false,
      checkoutLoading,
      checkoutLoadingTarget,
      startCheckout,
      openPortal,
      refresh,
      manualRetry,
      applyOptimisticDecrement,
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
      subscriptionStatus: null,
      subscriptionEnd: null,
      trialStart: null,
      trialEnd: null,
      subscriptionBillingInterval: null,
    };
  }

  return {
    subscribed,
    loading,
    checkoutLoading,
    checkoutLoadingTarget,
    startCheckout,
    openPortal,
    refresh,
    manualRetry,
    applyOptimisticDecrement,
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
    subscriptionStatus,
    subscriptionEnd,
    trialStart,
    trialEnd,
    subscriptionBillingInterval,
  };
}
