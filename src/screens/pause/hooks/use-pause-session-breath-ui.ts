import { useState, useRef, useCallback, useEffect } from 'react';
import type { PauseBreathingHandle } from '@/screens/pause/components/PauseBreathing';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/public';
import { usePauseSessionBreathTimedActiveReset } from '@/screens/pause/hooks/use-pause-session-breath-timed-active-reset';

export interface UsePauseSessionBreathUiParams {
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  step: PauseStep;
  setSwipeDirection: (dir: 'forward' | 'back') => void;
  setBriefIntegrateDone: (done: boolean) => void;
  setBriefStep: (step: BriefPauseStep) => void;
  setBreathingFirstCompleted: (done: boolean) => void;
  setBreathingSecondCompleted: (done: boolean) => void;
}

/**
 * Timed-breathing UI state, shell-back visibility flags, and repeat-from-intro handlers
 * for `/pause` brief and deep rituals.
 */
export function usePauseSessionBreathUi({
  ritualEntry,
  briefStep,
  step,
  setSwipeDirection,
  setBriefIntegrateDone,
  setBriefStep,
  setBreathingFirstCompleted,
  setBreathingSecondCompleted,
}: UsePauseSessionBreathUiParams) {
  const breathingRef = useRef<PauseBreathingHandle>(null);
  const [breathTimedActive, setBreathTimedActive] = useState(false);
  const [breathFirstTimedPatternStarted, setBreathFirstTimedPatternStarted] = useState(false);
  const [breathSecondTimedPatternStarted, setBreathSecondTimedPatternStarted] = useState(false);

  usePauseSessionBreathTimedActiveReset({ step, ritualEntry, briefStep, setBreathTimedActive });

  const trackBreathTimedActive = useCallback(
    (active: boolean) => {
      if (
        active &&
        ((ritualEntry === 'deep' && step === 'breathe') ||
          (ritualEntry === 'brief' && briefStep === 'breath') ||
          (ritualEntry === 'picker' && step === 'breathe'))
      ) {
        setBreathFirstTimedPatternStarted(true);
      }
      if (active && (ritualEntry === 'deep' || ritualEntry === 'picker') && step === 'breath2') {
        setBreathSecondTimedPatternStarted(true);
      }
      setBreathTimedActive(active);
    },
    [ritualEntry, briefStep, step],
  );

  useEffect(() => {
    const onFirstBreath =
      (ritualEntry === 'deep' && step === 'breathe') ||
      (ritualEntry === 'brief' && briefStep === 'breath') ||
      (ritualEntry === 'picker' && step === 'breathe');
    if (!onFirstBreath) setBreathFirstTimedPatternStarted(false);
  }, [ritualEntry, step, briefStep]);

  useEffect(() => {
    if (step !== 'breath2') setBreathSecondTimedPatternStarted(false);
  }, [step]);

  const handleBriefRepeatBreaths = useCallback(() => {
    setSwipeDirection('back');
    setBriefIntegrateDone(false);
    setBreathingFirstCompleted(false);
    setBreathTimedActive(false);
    setBreathFirstTimedPatternStarted(false);
    setBriefStep('breath');
    queueMicrotask(() => breathingRef.current?.resetToIntro());
  }, [
    setSwipeDirection,
    setBriefIntegrateDone,
    setBreathingFirstCompleted,
    setBriefStep,
  ]);

  const handleDeepFirstBreathRepeat = useCallback(() => {
    setSwipeDirection('back');
    setBreathingFirstCompleted(false);
    setBreathTimedActive(false);
    setBreathFirstTimedPatternStarted(false);
    queueMicrotask(() => breathingRef.current?.resetToIntro());
  }, [setSwipeDirection, setBreathingFirstCompleted]);

  const handleDeepSecondBreathRepeat = useCallback(() => {
    setSwipeDirection('back');
    setBreathingSecondCompleted(false);
    setBreathTimedActive(false);
    setBreathSecondTimedPatternStarted(false);
    queueMicrotask(() => breathingRef.current?.resetToIntro());
  }, [setSwipeDirection, setBreathingSecondCompleted]);

  return {
    breathingRef,
    breathTimedActive,
    setBreathTimedActive,
    breathFirstTimedPatternStarted,
    breathSecondTimedPatternStarted,
    setBreathFirstTimedPatternStarted,
    setBreathSecondTimedPatternStarted,
    trackBreathTimedActive,
    handleBriefRepeatBreaths,
    handleDeepFirstBreathRepeat,
    handleDeepSecondBreathRepeat,
  };
}
