import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackPausePendingAdopted, trackPausePendingDeclined } from './pending-pause-offer-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('pending-pause-offer-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks pending offer adopted and declined', () => {
    trackPausePendingAdopted('pause-new');
    trackPausePendingDeclined('pause-pending');
    expect(trackEvent).toHaveBeenNthCalledWith(1, 'pause_pending_adopted', {
      pause_instance_id: 'pause-new',
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, 'pause_pending_declined', {
      pause_instance_id: 'pause-pending',
    });
  });
});
