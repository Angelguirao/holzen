import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  trackHomePendingPauseBannerPauseOpened,
  trackPauseOpenDismissed,
} from './home-pause-actions-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('home-pause-actions-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks pause open dismissed', () => {
    trackPauseOpenDismissed('home_your_pause_widget', 'pause-1');
    expect(trackEvent).toHaveBeenCalledWith('pause_open_dismissed', {
      surface: 'home_your_pause_widget',
      pause_instance_id: 'pause-1',
    });
  });

  it('tracks pending banner pause opened', () => {
    trackHomePendingPauseBannerPauseOpened('pause-2', 'active');
    expect(trackEvent).toHaveBeenCalledWith('home.pending_pause_banner_pause_opened', {
      pause_instance_id: 'pause-2',
      open_pause_state: 'active',
    });
  });
});
