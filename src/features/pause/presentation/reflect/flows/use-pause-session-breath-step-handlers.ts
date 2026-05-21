import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  BRIEF_FIRST_BREATH_SEGMENT_LOG,
  BRIEF_PAUSE_STEP_AFTER_BREATH,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE,
  claimBriefIntegrateAdvance,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH,
  shouldResetBriefIntegrateAdvanceGuard,
} from '@/features/pause/application/use-cases/ritual/breathe/pause-breath-step-navigation';
import type { BriefPauseStep, PauseStep, RitualDepth } from '@/features/pause/public-hooks';

/**
 * Deep + brief ritual transitions around breath segments (`ensure` / skip RPCs) and brief integrate advance guard.
 */
export function usePauseSessionBreathStepHandlers(input: {
  goToStep: (next: PauseStep) => void;
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  ensureBreathSegment1Logged: (briefRitual?: boolean) => Promise<boolean>;
  ensureBreathSegment2Logged: () => Promise<boolean>;
  logBreathSegment1Skipped: (opts?: { briefRitual?: boolean }) => Promise<boolean>;
  logBreathSegment2Skipped: () => Promise<boolean>;
  setBreathingFirstCompleted: Dispatch<SetStateAction<boolean>>;
  setBreathingSecondCompleted: Dispatch<SetStateAction<boolean>>;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
  setBriefIntegrateDone: Dispatch<SetStateAction<boolean>>;
}): {
  handleContinueAfterFirstBreath: () => Promise<void>;
  handleContinueAfterSecondBreath: () => Promise<void>;
  handleSkipFirstBreath: () => Promise<void>;
  handleSkipSecondBreath: () => Promise<void>;
  handleBriefBreathContinue: () => Promise<void>;
  handleBriefSkipBreath: () => Promise<void>;
  handleBriefIntegrateComplete: () => void;
} {
  const {
    goToStep,
    ritualEntry,
    briefStep,
    ensureBreathSegment1Logged,
    ensureBreathSegment2Logged,
    logBreathSegment1Skipped,
    logBreathSegment2Skipped,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setBriefStep,
    setBriefIntegrateDone,
  } = input;

  const integrateAdvanceRef = useRef(false);
  useEffect(() => {
    if (shouldResetBriefIntegrateAdvanceGuard(ritualEntry, briefStep)) {
      integrateAdvanceRef.current = false;
    }
  }, [ritualEntry, briefStep]);

  const handleContinueAfterFirstBreath = useCallback(async () => {
    const ok = await ensureBreathSegment1Logged();
    if (!ok) return;
    goToStep(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH);
  }, [ensureBreathSegment1Logged, goToStep]);

  const handleContinueAfterSecondBreath = useCallback(async () => {
    const ok = await ensureBreathSegment2Logged();
    if (!ok) return;
    goToStep(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH);
  }, [ensureBreathSegment2Logged, goToStep]);

  const handleSkipFirstBreath = useCallback(async () => {
    setBreathingFirstCompleted(false);
    const ok = await logBreathSegment1Skipped();
    if (!ok) return;
    setBreathingFirstCompleted(true);
    goToStep(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH);
  }, [logBreathSegment1Skipped, goToStep, setBreathingFirstCompleted]);

  const handleSkipSecondBreath = useCallback(async () => {
    setBreathingSecondCompleted(false);
    const ok = await logBreathSegment2Skipped();
    if (!ok) return;
    setBreathingSecondCompleted(true);
    goToStep(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH);
  }, [logBreathSegment2Skipped, goToStep, setBreathingSecondCompleted]);

  const handleBriefBreathContinue = useCallback(async () => {
    const ok = await ensureBreathSegment1Logged(BRIEF_FIRST_BREATH_SEGMENT_LOG.briefRitual);
    if (!ok) return;
    setBreathingFirstCompleted(true);
    setBriefStep(BRIEF_PAUSE_STEP_AFTER_BREATH);
  }, [ensureBreathSegment1Logged, setBreathingFirstCompleted, setBriefStep]);

  const handleBriefSkipBreath = useCallback(async () => {
    setBreathingFirstCompleted(false);
    const ok = await logBreathSegment1Skipped(BRIEF_FIRST_BREATH_SEGMENT_LOG);
    if (!ok) return;
    setBreathingFirstCompleted(true);
    setBriefStep(BRIEF_PAUSE_STEP_AFTER_BREATH);
  }, [logBreathSegment1Skipped, setBreathingFirstCompleted, setBriefStep]);

  const handleBriefIntegrateComplete = useCallback(() => {
    const claim = claimBriefIntegrateAdvance(integrateAdvanceRef.current);
    if (!claim.canAdvance) return;
    integrateAdvanceRef.current = claim.nextLocked;
    setBriefIntegrateDone(true);
    setBriefStep(BRIEF_PAUSE_STEP_AFTER_INTEGRATE);
  }, [setBriefIntegrateDone, setBriefStep]);

  return {
    handleContinueAfterFirstBreath,
    handleContinueAfterSecondBreath,
    handleSkipFirstBreath,
    handleSkipSecondBreath,
    handleBriefBreathContinue,
    handleBriefSkipBreath,
    handleBriefIntegrateComplete,
  };
}
