import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { BriefPauseStep, PauseStep, RitualDepth } from '@/features/pause/public-hooks';

/**
 * Clears timed-breathing UI state when leaving the macro step that owns the timed pattern (brief vs deep).
 */
export function usePauseSessionBreathTimedActiveReset(input: {
  step: PauseStep;
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  setBreathTimedActive: Dispatch<SetStateAction<boolean>>;
}): void {
  const { step, ritualEntry, briefStep, setBreathTimedActive } = input;

  useEffect(() => {
    if (ritualEntry === 'brief') {
      if (briefStep !== 'breath') setBreathTimedActive(false);
      return;
    }
    if (step !== 'breathe' && step !== 'breath2') setBreathTimedActive(false);
  }, [step, ritualEntry, briefStep, setBreathTimedActive]);
}
