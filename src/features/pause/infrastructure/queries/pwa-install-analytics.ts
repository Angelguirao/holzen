import { runLogPwaInstallAnalyticsEvent } from '@/features/pause/application/use-cases/home/run-log-pwa-install-analytics-event';
import { supabasePauseAnalyticsRepository } from '@/features/pause/infrastructure/supabase-pause-analytics-repository';

/** Fire-and-forget PWA install funnel events (`analytics_events` table). */
export function logPwaInstallAnalyticsEvent(
  userId: string | undefined,
  event: string,
  metadata?: Record<string, unknown>,
): void {
  if (!userId) return;
  void runLogPwaInstallAnalyticsEvent(supabasePauseAnalyticsRepository, {
    userId,
    event,
    metadata: metadata ?? {},
  });
}
