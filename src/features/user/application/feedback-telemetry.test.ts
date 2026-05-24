import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readPostHogSessionIdForFeedback, trackFeedbackSubmitted } from './feedback-telemetry';

const trackEvent = vi.fn();
const getPostHog = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
  getPostHog: () => getPostHog(),
}));

describe('feedback-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
    getPostHog.mockReset();
  });

  it('tracks feedback submitted', () => {
    trackFeedbackSubmitted('bug');
    expect(trackEvent).toHaveBeenCalledWith('feedback.submitted', { category: 'bug' });
  });

  it('reads session id when PostHog exposes getter', () => {
    getPostHog.mockReturnValue({
      get_session_id: () => 'sess_abc',
    });
    expect(readPostHogSessionIdForFeedback()).toBe('sess_abc');
  });

  it('returns undefined when PostHog is unavailable', () => {
    getPostHog.mockReturnValue(null);
    expect(readPostHogSessionIdForFeedback()).toBeUndefined();
  });
});
