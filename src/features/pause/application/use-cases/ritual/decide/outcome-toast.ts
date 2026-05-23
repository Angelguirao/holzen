import type { TFunction } from 'i18next';
import { toast } from 'sonner';

/** Sonner error when `outcome_logged` fails. */
export function showPauseOutcomeSaveFailedToast(t: TFunction): void {
  toast.error(
    t('pause.outcomeSaveFailed', {
      defaultValue: 'Could not save your choice. Try again.',
    }),
    { duration: 5000 },
  );
}

/** Sonner error when outcome saved but pause state is not `completed`. */
export function showPauseOutcomeNotCompletedToast(t: TFunction): void {
  toast.error(
    t('pause.outcomeNotCompleted', {
      defaultValue:
        'Your choice was saved, but this pause is not complete yet — open Reflect and finish a companion card, then choose again.',
    }),
    { duration: 8000 },
  );
}
