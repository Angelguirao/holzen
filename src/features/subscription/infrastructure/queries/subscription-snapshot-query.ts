/**
 * Subscription snapshot: `check-subscription` edge with a small localStorage
 * cache for offline / cold-start fallbacks.
 */

import { invokeCheckSubscription } from '../edge/subscription-query-edge';
import type {
  SubCache,
  SubscriptionBillingInterval,
  SubscriptionSnapshot,
} from '@/features/subscription/domain/subscription-snapshot';

export const SUB_CACHE_KEY = 'holzen_sub_cache';

export const SUBSCRIPTION_QUERY_PREFIX = ['subscription'] as const;

export const subscriptionQueryKey = (userId: string) =>
  [...SUBSCRIPTION_QUERY_PREFIX, userId] as const;

export function readSubCache(): SubCache | null {
  try {
    const raw = localStorage.getItem(SUB_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SubCache;
  } catch {
    return null;
  }
}

export function writeSubCache(c: SubCache) {
  try {
    localStorage.setItem(SUB_CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

export async function fetchSubscriptionSnapshot(
  _userId: string,
  force: boolean,
): Promise<SubscriptionSnapshot> {
  const { data, error } = await invokeCheckSubscription(force);
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

  const subscriptionStatus = (data.subscription_status as string) ?? null;
  const subscriptionEnd = (data.subscription_end as string) ?? null;

  writeSubCache({
    subscribed: false,
    tier: 'free',
    monthlyUsed: 0,
    monthlyRemaining: 0,
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
    monthlyUsed: 0,
    monthlyRemaining: 0,
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
    subscriptionStatus,
    subscriptionEnd,
    trialStart: null,
    trialEnd: null,
    subscriptionBillingInterval: null,
  };
}
