import { trackEvent } from '@/lib/posthog';

export type PaywallViewedSource = 'feature-gate' | 'limit-hit' | 'settings';

/** Paywall UI impression (taxonomy: paywall.viewed). */
export function trackPaywallViewed(source: PaywallViewedSource): void {
  try {
    trackEvent('paywall.viewed', { source });
  } catch {
    /* no-op */
  }
}
