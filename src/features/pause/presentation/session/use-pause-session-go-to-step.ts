import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { pauseStepSwipeDirection } from './pause-session-step-transition-io';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
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
