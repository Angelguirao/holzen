import type { TFunction } from 'i18next';
import { toast } from 'sonner';

/** Sonner error when a `pauseLogStep` call fails in the pause ritual. */
export function showPauseStepSyncFailedToast(t: TFunction): void {
  toast.error(
    t('pause.stepSyncFailed', {
      defaultValue: 'Could not sync this step. Check your connection and try again.',
    }),
    { duration: 5000 },
  );
}
