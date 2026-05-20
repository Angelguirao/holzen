import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackPaywallViewed } from './paywall-telemetry';

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
});
