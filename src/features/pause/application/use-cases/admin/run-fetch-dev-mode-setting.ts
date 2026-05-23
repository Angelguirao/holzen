import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';

/** Read persisted admin dev-mode toggle via `PauseAnalyticsRepository`. */
export async function runFetchDevModeSetting(
  repository: PauseAnalyticsRepository,
  userId: string,
): Promise<boolean | null> {
  return repository.fetchDevModeSetting(userId);
}
