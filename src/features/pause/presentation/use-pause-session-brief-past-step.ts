import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { computeBriefPastStepClick } from '@/features/pause/public';
import { hapticFeedback } from '@/lib/haptics';
import { type BriefPauseStep } from '@/features/pause/public';

export type UsePauseSessionBriefPastStepParams = {
  briefStep: BriefPauseStep;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
  setBriefIntegrateDone: Dispatch<SetStateAction<boolean>>;
  setSwipeDirection: Dispatch<SetStateAction<'forward' | 'back'>>;
};

/** Navigate to an earlier brief macro (haptics + optional integrate flag clear). Not used from the read-only header stepper. */
export function usePauseSessionBriefPastStep(
  input: UsePauseSessionBriefPastStepParams,
): { goToBriefPastStep: (target: BriefPauseStep) => void } {
  const { briefStep, setBriefStep, setBriefIntegrateDone, setSwipeDirection } = input;

  const goToBriefPastStep = useCallback(
    (target: BriefPauseStep) => {
      const nav = computeBriefPastStepClick(target, briefStep);
      if (!nav) return;
      setSwipeDirection('back');
      hapticFeedback('light');
      setBriefStep(nav.target);
      if (nav.clearBriefIntegrateDone) setBriefIntegrateDone(false);
    },
    [briefStep, setBriefStep, setBriefIntegrateDone, setSwipeDirection],
  );

  return { goToBriefPastStep };
}
