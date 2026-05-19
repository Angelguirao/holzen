import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invokeEdge } from '@/lib/invoke-edge';
import { useAuth } from '@/features/auth/public';
import { holzenLog } from '@/lib/holzen-console';
import { getCheckoutSuppressionWindowMs } from '@/features/subscription/public';
import {
  canEngagePauseFromEntitlement,
  deriveEntitlement,
  type Entitlement,
  type SubscriptionSnapshot,
} from '@/features/subscription/public';
import {
  fetchSubscriptionSnapshot,
  readSubCache,
  subscriptionQueryKey,
} from '@/features/subscription/public-queries';
import { trackEvent } from '@/lib/posthog';

const CHECKOUT_RETURN_KEY = 'holzen_checkout_started_at';
/** Set when a checkout return includes `?subscribed=true` (timestamp for PaywallSubscribedTracker TTL) */
export const POST_CHECKOUT_SUBSCRIBE_FLAG = 'holzen_post_checkout_subscribe';
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

export type { SubscriptionBillingInterval } from '@/features/subscription/public';
export type { Entitlement } from '@/features/subscription/public';

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

export function useSubscription() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [checkoutLoadingTarget, setCheckoutLoadingTarget] = useState<
    'pro' | 'pro_plus' | 'flex_pack_s' | 'flex_pack_m' | null
  >(null);
  const lastLoggedSubRef = useRef<{ subscribed: boolean; monthlyRemaining: number | undefined } | null>(null);

  const query = useQuery({
    queryKey: userId != null ? subscriptionQueryKey(userId) : (['subscription', null] as const),
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
        (queryClient.getQueryData(subscriptionQueryKey(userId!)) ? 'interval' : 'mount');
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
      void queryClient.invalidateQueries({ queryKey: subscriptionQueryKey(userId) });
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

  const startCheckout = useCallback(async (
    target: 'pro' | 'pro_plus' | 'flex_pack_s' | 'flex_pack_m' = 'pro',
    options?: { reactivation?: boolean },
  ) => {
    holzenLog.subscription('checkout', { action: 'start', target });
    setCheckoutLoading(true);
    setCheckoutLoadingTarget(target);
    try {
      sessionStorage.setItem(CHECKOUT_RETURN_KEY, String(Date.now()));
      const isPack = target === 'flex_pack_s' || target === 'flex_pack_m';
      const { data, error } = await invokeEdge<{ url?: string }>('create-checkout', {
        body: isPack
          ? { checkoutKind: target }
          : {
              checkoutKind: 'subscription',
              planTier: target,
              reactivation: options?.reactivation === true,
            },
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

  const ensureTrial = useCallback(async () => {
    if (!userId) return;
    holzenLog.subscription('trial', { action: 'ensure' });
    setTrialLoading(true);
    try {
      const { data, error } = await invokeEdge<{ ok?: boolean; created?: boolean }>(
        'ensure-trial-subscription',
        {
          body: {},
        },
      );
      if (error) throw error;
      if (!data?.ok) throw new Error('Trial not started');
      if (data.created) {
        try {
          trackEvent('trial.started', { source: 'ensure_trial' });
        } catch {
          /* no-op */
        }
      }
      subscriptionForceNext = true;
      subscriptionNextFetchSource = 'invalidate';
      await queryClient.invalidateQueries({ queryKey: subscriptionQueryKey(userId) });
    } catch (e) {
      console.error('Trial error:', e);
      toast.error(
        t('home.subscription.trialFailed', { defaultValue: 'Could not start trial. Try again.' }),
      );
      throw e;
    } finally {
      setTrialLoading(false);
    }
  }, [userId, queryClient, t]);

  const openPortal = useCallback(async () => {
    holzenLog.subscription('portal', { action: 'open' });
    try {
      const { data, error } = await invokeEdge<{ url?: string }>('customer-portal');
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
    return queryClient.invalidateQueries({ queryKey: subscriptionQueryKey(userId) });
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
    return queryClient.invalidateQueries({ queryKey: subscriptionQueryKey(userId) });
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
        subscriptionQueryKey(userId),
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

  const entitlement: Entitlement = !userId
    ? 'pre_trial'
    : deriveEntitlement({ subscribed, subscriptionStatus });
  const prevEntitlementRef = useRef<Entitlement | null>(null);
  useEffect(() => {
    const prev = prevEntitlementRef.current;
    if (prev && prev !== 'lapsed' && entitlement === 'lapsed') {
      try {
        trackEvent('trial.expired', {});
      } catch {
        /* no-op */
      }
    }
    prevEntitlementRef.current = entitlement;
  }, [entitlement]);
  const canEngagePause = canEngagePauseFromEntitlement(entitlement);
  const isLapsed = entitlement === 'lapsed';
  const canReflect = canEngagePause;

  const startReactivationCheckout = useCallback(() => startCheckout('pro', { reactivation: true }), [startCheckout]);

  if (!userId) {
    return {
      subscribed: false,
      loading: false,
      checkoutLoading,
      trialLoading,
      checkoutLoadingTarget,
      startCheckout,
      ensureTrial,
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
      entitlement: 'pre_trial' as Entitlement,
      canEngagePause: false,
      isLapsed: false,
      canReflect: false,
      startReactivationCheckout: async () => {},
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
    trialLoading,
    checkoutLoadingTarget,
    startCheckout,
    ensureTrial,
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
    entitlement,
    canEngagePause,
    isLapsed,
    canReflect,
    startReactivationCheckout,
    subscriptionStatus,
    subscriptionEnd,
    trialStart,
    trialEnd,
    subscriptionBillingInterval,
  };
}
