import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { ritualDepthUpgradedPayload } from './ritual-depth-upgrade-payload';

export { ritualDepthUpgradedPayload } from './ritual-depth-upgrade-payload';

export type RunRitualDepthUpgradeResult =
  | { status: 'success' }
  | { status: 'sync_failed' };

/** Persists brief → deep upgrade so Postgres/analytics no longer treat the row as brief-only. */
export async function logPauseRitualDepthUpgraded(
  repository: PauseRepository,
  instanceId: string,
): Promise<RunRitualDepthUpgradeResult> {
  try {
    await logPauseStep(repository, {
      instanceId,
      stepType: 'ritual_depth_upgraded',
      payload: ritualDepthUpgradedPayload(),
    });
    return { status: 'success' };
  } catch {
    return { status: 'sync_failed' };
  }
}
