import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackPauseOutcomeRetrospective } from './archive-retrospective-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('archive-retrospective-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks pause outcome retrospective on archive surface', () => {
    trackPauseOutcomeRetrospective({
      pauseInstanceId: 'pause-1',
      outcome: 'held',
    });
    expect(trackEvent).toHaveBeenCalledWith('pause_outcome_retrospective', {
      pause_instance_id: 'pause-1',
      outcome: 'held',
      surface: 'archive',
    });
  });
});
