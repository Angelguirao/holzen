import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { PauseStep } from '@/components/pause/PauseProgress';
import { pauseStepSwipeDirection } from '@/features/pause/application/session/step-swipe-direction';
import { hapticFeedback } from '@/lib/haptics';

/** Deep ritual: advance to next `PauseStep` with swipe direction + haptic. */
export function usePauseSessionGoToStep(input: {
  step: PauseStep;
  setSwipeDirection: Dispatch<SetStateAction<'forward' | 'back'>>;
  setStep: Dispatch<SetStateAction<PauseStep>>;
}): { goToStep: (next: PauseStep) => void } {
  const { step, setSwipeDirection, setStep } = input;

  const goToStep = useCallback(
    (next: PauseStep) => {
      setSwipeDirection(pauseStepSwipeDirection(step, next));
      hapticFeedback('light');
      setStep(next);
    },
    [step, setSwipeDirection, setStep],
  );

  return { goToStep };
}
