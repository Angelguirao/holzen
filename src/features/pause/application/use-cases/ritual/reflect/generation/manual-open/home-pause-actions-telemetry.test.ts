import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackPauseOpenDismissed } from './home-pause-actions-telemetry';

const trackEvent = vi.fn();

vi.mock('@/features/pause/application/pause-product-analytics', () => ({
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
});
