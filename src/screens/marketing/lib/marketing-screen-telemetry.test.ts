import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackAppRouteNotFound } from './marketing-screen-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('marketing-screen-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks route not found with pathname only', () => {
    trackAppRouteNotFound('/missing-route');
    expect(trackEvent).toHaveBeenCalledWith('app.route_not_found', {
      attempted_path: '/missing-route',
    });
  });
});
