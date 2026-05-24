import { getPostHog, trackEvent } from '@/lib/posthog';

export type FeedbackCategory = 'bug' | 'feature' | 'question';

export function trackFeedbackSubmitted(category: FeedbackCategory): void {
  try {
    trackEvent('feedback.submitted', { category });
  } catch {
    /* no-op */
  }
}

/** Optional PostHog session id for send-feedback edge payload (privacy-safe). */
export function readPostHogSessionIdForFeedback(): string | undefined {
  const ph = getPostHog();
  if (!ph) return undefined;
  try {
    const getter = (ph as unknown as { get_session_id?: () => string }).get_session_id;
    if (typeof getter === 'function') return getter.call(ph);
  } catch {
    /* no-op */
  }
  return undefined;
}
