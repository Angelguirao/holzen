import { trackEvent } from '@/lib/posthog';
import type { SubscriptionBillingInterval } from '../domain/subscription-snapshot';

export type PaywallViewedSource = 'feature-gate' | 'limit-hit' | 'settings';
export type PaywallSubscribedPlan = 'monthly' | 'yearly' | 'unknown';
export type TrialStartedSource = 'ensure_trial';

/** Paywall UI impression (taxonomy: paywall.viewed). */
export function trackPaywallViewed(source: PaywallViewedSource): void {
  try {
    trackEvent('paywall.viewed', { source });
  } catch {
    /* no-op */
  }
}

export function paywallPlanFromBillingInterval(
  interval: SubscriptionBillingInterval | null,
): PaywallSubscribedPlan {
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'yearly';
  return 'unknown';
}

/** After checkout return when subscription snapshot confirms active sub (paywall.subscribed). */
export function trackPaywallSubscribed(plan: PaywallSubscribedPlan): void {
  try {
    trackEvent('paywall.subscribed', { plan });
  } catch {
    /* no-op */
  }
}

/** Stripe trial created via ensure-trial-subscription (`created: true`). */
export function trackTrialStarted(source: TrialStartedSource): void {
  try {
    trackEvent('trial.started', { source });
  } catch {
    /* no-op */
  }
}

/** Client entitlement transitions to lapsed (trial ended without paid sub). */
export function trackTrialExpired(): void {
  try {
    trackEvent('trial.expired', {});
  } catch {
    /* no-op */
  }
}
