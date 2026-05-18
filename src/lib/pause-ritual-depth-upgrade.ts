import type { TFunction } from 'i18next';
import { pauseLogStep } from '@/features/pause/public-rpc';
import { ritualDepthUpgradedPayload } from '@/lib/pause-ritual-depth-upgrade-payload';
import { showPauseStepSyncFailedToast } from '@/lib/pause-step-sync-toast';

export { ritualDepthUpgradedPayload } from '@/lib/pause-ritual-depth-upgrade-payload';

/** Persists brief → deep upgrade so Postgres/analytics no longer treat the row as brief-only. */
export async function logPauseRitualDepthUpgraded(
  instanceId: string,
  t: TFunction,
): Promise<boolean> {
  try {
    await pauseLogStep({
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
