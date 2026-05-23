import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';
import {
  buildCompanionFullviewOpenedMetadata,
  type LogCompanionFullviewOpenedInput,
} from './log-companion-fullview-opened';

/** Persist companion fullview open via `analytics_events` (port-backed). */
export async function runLogCompanionFullviewOpened(
  repository: PauseAnalyticsRepository,
  input: LogCompanionFullviewOpenedInput,
): Promise<{ ok: boolean }> {
  return repository.insertEvent({
    userId: input.userId,
    event: 'companion_fullview_opened',
    metadata: buildCompanionFullviewOpenedMetadata({
      companion: input.companion,
      pauseInstanceId: input.pauseInstanceId,
    }),
  });
}
