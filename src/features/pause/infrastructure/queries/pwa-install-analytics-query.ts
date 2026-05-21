import {
  runLogPwaInstallAnalyticsEvent,
  type LogPwaInstallAnalyticsEventInput,
} from '@/features/pause/application/use-cases/home/run-log-pwa-install-analytics-event';
import { supabasePauseAnalyticsRepository } from '@/features/pause/public-rpc';

export type { LogPwaInstallAnalyticsEventInput };

/** PWA install funnel — wired `PauseAnalyticsRepository.insertEvent`. */
export async function logPausePwaInstallAnalyticsEvent(
  input: LogPwaInstallAnalyticsEventInput,
): Promise<{ ok: boolean }> {
  return runLogPwaInstallAnalyticsEvent(supabasePauseAnalyticsRepository, input);
}

/** Fire-and-forget PWA install funnel events — Home imports via `public-hooks`. */
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
