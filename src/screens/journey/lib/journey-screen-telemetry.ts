import { trackEvent } from '@/lib/posthog';

export type JourneyOverviewViewedPayload = {
  streak_days?: number;
  completed_pause_count?: number;
};

/** First paint after journey overview data is ready (aggregates only). */
export function trackJourneyOverviewViewed(payload: JourneyOverviewViewedPayload): void {
  try {
    trackEvent('journey.overview_viewed', payload);
  } catch {
    /* no-op */
  }
}
