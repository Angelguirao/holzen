import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { PauseBreathingHandle } from '@/screens/pause/components/PauseBreathing';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import { computePauseHeaderBackIntent } from '@/features/pause/public';
import { type BriefPauseStep, type RitualDepth } from '@/features/pause/public';

export function usePauseSessionHeaderBackHandler(input: {
  breathingRef: MutableRefObject<PauseBreathingHandle | null>;
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  step: PauseStep;
  breathTimedActive: boolean;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  goBack: () => void;
  setBreathingFirstCompleted: Dispatch<SetStateAction<boolean>>;
  setBreathingSecondCompleted: Dispatch<SetStateAction<boolean>>;
  setBreathSecondTimedPatternStarted: Dispatch<SetStateAction<boolean>>;
}): { handlePauseHeaderBack: () => void } {
  const {
    breathingRef,
    ritualEntry,
    briefStep,
    step,
    breathTimedActive,
    breathingFirstCompleted,
    breathingSecondCompleted,
    goBack,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setBreathSecondTimedPatternStarted,
  } = input;

  const handlePauseHeaderBack = useCallback(() => {
    const intent = computePauseHeaderBackIntent({
      ritualEntry,
      briefStep,
      step,
      breathTimedActive,
      breathingFirstCompleted,
      breathingSecondCompleted,
    });
    switch (intent.kind) {
      case 'deep_breath_reset_intro':
        breathingRef.current?.resetToIntro();
        if (step === 'breath2') setBreathSecondTimedPatternStarted(false);
        return;
      case 'deep_breath2_reset_intro_clear_second':
        breathingRef.current?.resetToIntro();
        setBreathingSecondCompleted(false);
        setBreathSecondTimedPatternStarted(false);
        return;
      case 'go_back':
        if (ritualEntry === 'deep' && step === 'breathe') {
          setBreathingFirstCompleted(false);
        }
        if ((ritualEntry === 'deep' || ritualEntry === 'picker') && step === 'breath2') {
          setBreathingSecondCompleted(false);
        }
        goBack();
    }
  }, [
    breathingRef,
    ritualEntry,
    briefStep,
    step,
    breathTimedActive,
    breathingFirstCompleted,
    breathingSecondCompleted,
    goBack,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setBreathSecondTimedPatternStarted,
  ]);

  return { handlePauseHeaderBack };
}
