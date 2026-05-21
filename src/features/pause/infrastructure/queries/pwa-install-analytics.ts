import { logPausePwaInstallAnalyticsEvent } from '@/features/pause/public-rpc';

/** Fire-and-forget PWA install funnel events (`analytics_events` table). */
export function logPwaInstallAnalyticsEvent(
  userId: string | undefined,
  event: string,
  metadata?: Record<string, unknown>,
): void {
  if (!userId) return;
  void logPausePwaInstallAnalyticsEvent({
    userId,
    event,
    metadata: metadata ?? {},
  });
}
