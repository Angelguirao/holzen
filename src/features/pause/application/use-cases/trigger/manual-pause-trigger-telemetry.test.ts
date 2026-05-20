import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackPauseManualStarted } from './manual-pause-trigger-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('manual-pause-trigger-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks manual pause started from home', () => {
    trackPauseManualStarted('home');
    expect(trackEvent).toHaveBeenCalledWith('pause.manual_started', { surface: 'home' });
  });
});
