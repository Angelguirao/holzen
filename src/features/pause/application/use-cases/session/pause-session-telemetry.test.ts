import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackPauseSessionAbandoned } from './pause-session-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('pause-session-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks pause session abandoned with instance id', () => {
    trackPauseSessionAbandoned('pause-abc');
    expect(trackEvent).toHaveBeenCalledWith('pause_session_abandoned', {
      pause_instance_id: 'pause-abc',
    });
  });

  it('tracks pause session abandoned without instance id', () => {
    trackPauseSessionAbandoned(undefined);
    expect(trackEvent).toHaveBeenCalledWith('pause_session_abandoned', {
      pause_instance_id: undefined,
    });
  });
});
