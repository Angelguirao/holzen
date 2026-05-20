import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { computePauseHeaderBackIntent } from '@/features/pause/application/use-cases/session/header-back';
import type { BriefPauseStep, PauseStep, RitualDepth } from '@/features/pause/public-hooks';
import type { PauseBreathingHandle } from '@/features/pause/presentation/session/pause-breathing-handle';

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
