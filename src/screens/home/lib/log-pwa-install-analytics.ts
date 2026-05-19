import { insertPauseAnalyticsEvent } from '@/features/pause/public-queries';

/** Fire-and-forget PWA install funnel events (`analytics_events` table). */
export function logPwaInstallAnalyticsEvent(
  userId: string | undefined,
  event: string,
  metadata?: Record<string, unknown>,
): void {
  if (!userId) return;
  void insertPauseAnalyticsEvent({
    userId,
    event,
    metadata: metadata ?? {},
  });
}
