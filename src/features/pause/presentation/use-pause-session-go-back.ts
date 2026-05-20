import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { computePauseGoBackPlan } from '@/features/pause/public';
import { hapticFeedback } from '@/lib/haptics';
import type { BriefPauseStep, PauseStep, RitualDepth } from '@/features/pause/public-hooks';

/** Header / hardware back one step: brief macro order or deep `STEPS` (haptic + swipe direction). */
export function usePauseSessionGoBack(input: {
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  step: PauseStep;
  setSwipeDirection: Dispatch<SetStateAction<'forward' | 'back'>>;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
  setBriefIntegrateDone: Dispatch<SetStateAction<boolean>>;
  setStep: Dispatch<SetStateAction<PauseStep>>;
}): { goBack: () => void } {
  const { ritualEntry, briefStep, step, setSwipeDirection, setBriefStep, setBriefIntegrateDone, setStep } = input;

  const goBack = useCallback(() => {
    const plan = computePauseGoBackPlan(ritualEntry, briefStep, step);
    if (plan.kind === 'none') return;
    setSwipeDirection('back');
    hapticFeedback('light');
    if (plan.kind === 'brief') {
      if (plan.clearBriefIntegrateDone) setBriefIntegrateDone(false);
      setBriefStep(plan.prev);
    } else {
      setStep(plan.prev);
    }
  }, [step, ritualEntry, briefStep, setSwipeDirection, setBriefStep, setBriefIntegrateDone, setStep]);

  return { goBack };
}
