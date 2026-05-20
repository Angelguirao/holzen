import type { Dispatch, SetStateAction } from 'react';
import { isPauseSessionHeaderBackVisible } from '@/features/pause/application/use-cases/session/header-back';
import type { BriefPauseStep, PauseStep, RitualDepth } from '@/features/pause/public-hooks';
import { usePauseSessionBreathUi } from './use-pause-session-breath-ui';
import { usePauseSessionGoBack } from './session/use-pause-session-go-back';
import { usePauseSessionGoToStep } from './session/use-pause-session-go-to-step';
import { usePauseSessionHeaderBackHandler } from './use-pause-session-header-back-handler';

export type UsePauseSessionBreathNavigationParams = {
  phase: 'session' | 'done';
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  step: PauseStep;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  setSwipeDirection: Dispatch<SetStateAction<'forward' | 'back'>>;
  setStep: Dispatch<SetStateAction<PauseStep>>;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
  setBriefIntegrateDone: Dispatch<SetStateAction<boolean>>;
  setBreathingFirstCompleted: Dispatch<SetStateAction<boolean>>;
  setBreathingSecondCompleted: Dispatch<SetStateAction<boolean>>;
};

/** Step navigation, timed breath UI state, and header-back visibility for the pause ritual. */
export function usePauseSessionBreathNavigation({
  phase,
  ritualEntry,
  briefStep,
  step,
  breathingFirstCompleted,
  breathingSecondCompleted,
  setSwipeDirection,
  setStep,
  setBriefStep,
  setBriefIntegrateDone,
  setBreathingFirstCompleted,
  setBreathingSecondCompleted,
}: UsePauseSessionBreathNavigationParams) {
  const { goToStep } = usePauseSessionGoToStep({
    step,
    setSwipeDirection,
    setStep,
  });

  const { goBack } = usePauseSessionGoBack({
    ritualEntry,
    briefStep,
    step,
    setSwipeDirection,
    setBriefStep,
    setBriefIntegrateDone,
    setStep,
  });

  const {
    breathingRef,
    breathTimedActive,
    setBreathTimedActive: setBreathTimedActiveInner,
    breathFirstTimedPatternStarted,
    breathSecondTimedPatternStarted,
    setBreathFirstTimedPatternStarted,
    setBreathSecondTimedPatternStarted,
    trackBreathTimedActive,
    handleBriefRepeatBreaths,
    handleDeepFirstBreathRepeat,
    handleDeepSecondBreathRepeat,
  } = usePauseSessionBreathUi({
    ritualEntry,
    briefStep,
    step,
    setSwipeDirection,
    setBriefIntegrateDone,
    setBriefStep,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
  });

  const { handlePauseHeaderBack } = usePauseSessionHeaderBackHandler({
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
  });

  const showPauseHeaderBack = isPauseSessionHeaderBackVisible({
    phase,
    ritualEntry,
    briefStep,
    step,
    breathTimedActive,
    breathFirstTimedPatternStarted,
    breathSecondTimedPatternStarted,
    breathingFirstCompleted,
    breathingSecondCompleted,
  });

  return {
    goToStep,
    breathingRef,
    breathTimedActive,
    setBreathTimedActiveInner,
    setBreathFirstTimedPatternStarted,
    trackBreathTimedActive,
    handleBriefRepeatBreaths,
    handleDeepFirstBreathRepeat,
    handleDeepSecondBreathRepeat,
    handlePauseHeaderBack,
    showPauseHeaderBack,
  };
}
