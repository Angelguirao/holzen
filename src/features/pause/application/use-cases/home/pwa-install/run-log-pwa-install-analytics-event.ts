import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';

export type LogPwaInstallAnalyticsEventInput = {
  userId: string;
  event: string;
  metadata: Record<string, unknown>;
};

/** Persist PWA install funnel events via `analytics_events` (port-backed). */
export async function runLogPwaInstallAnalyticsEvent(
  repository: PauseAnalyticsRepository,
  input: LogPwaInstallAnalyticsEventInput,
): Promise<{ ok: boolean }> {
  return repository.insertEvent(input);
}
