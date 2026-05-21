import type { TFunction } from 'i18next';
import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import { showPauseStepSyncFailedToast } from '@/features/pause/application/use-cases/feedback/step-sync-toast';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { ritualDepthUpgradedPayload } from './ritual-depth-upgrade-payload';

export { ritualDepthUpgradedPayload } from './ritual-depth-upgrade-payload';

/** Persists brief → deep upgrade so Postgres/analytics no longer treat the row as brief-only. */
export async function logPauseRitualDepthUpgraded(
  repository: PauseRepository,
  instanceId: string,
  t: TFunction,
): Promise<boolean> {
  try {
    await logPauseStep(repository, {
      instanceId,
      stepType: 'ritual_depth_upgraded',
      payload: ritualDepthUpgradedPayload(),
    });
    return true;
  } catch {
    showPauseStepSyncFailedToast(t);
    return false;
  }
}
