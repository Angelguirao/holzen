import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  paywallPlanFromBillingInterval,
  trackPaywallSubscribed,
  trackPaywallViewed,
  trackTrialExpired,
  trackTrialStarted,
} from './paywall-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('paywall-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks paywall viewed with source', () => {
    trackPaywallViewed('settings');
    expect(trackEvent).toHaveBeenCalledWith('paywall.viewed', { source: 'settings' });
  });

  it('maps billing interval to subscribed plan', () => {
    expect(paywallPlanFromBillingInterval('month')).toBe('monthly');
    expect(paywallPlanFromBillingInterval('year')).toBe('yearly');
    expect(paywallPlanFromBillingInterval(null)).toBe('unknown');
  });

  it('tracks paywall subscribed and trial lifecycle', () => {
    trackPaywallSubscribed('yearly');
    trackTrialStarted('ensure_trial');
    trackTrialExpired();
    expect(trackEvent).toHaveBeenNthCalledWith(1, 'paywall.subscribed', { plan: 'yearly' });
    expect(trackEvent).toHaveBeenNthCalledWith(2, 'trial.started', { source: 'ensure_trial' });
    expect(trackEvent).toHaveBeenNthCalledWith(3, 'trial.expired', {});
  });
});
