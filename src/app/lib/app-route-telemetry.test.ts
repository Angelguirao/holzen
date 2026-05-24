import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackAppRouteNotFound } from './app-route-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('app-route-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks route not found with pathname', () => {
    trackAppRouteNotFound('/missing');
    expect(trackEvent).toHaveBeenCalledWith('app.route_not_found', { attempted_path: '/missing' });
  });
});
