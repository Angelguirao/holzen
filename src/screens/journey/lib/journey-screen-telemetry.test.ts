import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackJourneyOverviewViewed } from './journey-screen-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('journey-screen-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks overview viewed with aggregates', () => {
    trackJourneyOverviewViewed({ streak_days: 3, completed_pause_count: 12 });
    expect(trackEvent).toHaveBeenCalledWith('journey.overview_viewed', {
      streak_days: 3,
      completed_pause_count: 12,
    });
  });
});
