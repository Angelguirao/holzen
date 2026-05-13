import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { PauseStep } from '@/components/pause/PauseProgress';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';

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
  setDecideOnBackStep: Dispatch<SetStateAction<'choose' | 'breath2'>>;
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
    setDecideOnBackStep,
    setBriefStep,
    setBriefIntegrateDone,
  } = input;

  const integrateAdvanceRef = useRef(false);
  useEffect(() => {
    if (ritualEntry === 'brief' && briefStep === 'integrate') integrateAdvanceRef.current = false;
  }, [ritualEntry, briefStep]);

  const handleContinueAfterFirstBreath = useCallback(async () => {
    const ok = await ensureBreathSegment1Logged();
    if (!ok) return;
    goToStep('reflect');
  }, [ensureBreathSegment1Logged, goToStep]);

  const handleContinueAfterSecondBreath = useCallback(async () => {
    const ok = await ensureBreathSegment2Logged();
    if (!ok) return;
    goToStep('choose');
  }, [ensureBreathSegment2Logged, goToStep]);

  const handleSkipFirstBreath = useCallback(async () => {
    setBreathingFirstCompleted(false);
    const ok = await logBreathSegment1Skipped();
    if (!ok) return;
    setBreathingFirstCompleted(true);
    goToStep('reflect');
  }, [logBreathSegment1Skipped, goToStep, setBreathingFirstCompleted]);

  const handleSkipSecondBreath = useCallback(async () => {
    setBreathingSecondCompleted(false);
    setDecideOnBackStep('breath2');
    const ok = await logBreathSegment2Skipped();
    if (!ok) return;
    setBreathingSecondCompleted(true);
    goToStep('decide');
  }, [logBreathSegment2Skipped, goToStep, setBreathingSecondCompleted, setDecideOnBackStep]);

  const handleBriefBreathContinue = useCallback(async () => {
    const ok = await ensureBreathSegment1Logged(true);
    if (!ok) return;
    setBreathingFirstCompleted(true);
    setBriefStep('integrate');
  }, [ensureBreathSegment1Logged, setBreathingFirstCompleted, setBriefStep]);

  const handleBriefSkipBreath = useCallback(async () => {
    setBreathingFirstCompleted(false);
    const ok = await logBreathSegment1Skipped({ briefRitual: true });
    if (!ok) return;
    setBreathingFirstCompleted(true);
    setBriefStep('integrate');
  }, [logBreathSegment1Skipped, setBreathingFirstCompleted, setBriefStep]);

  const handleBriefIntegrateComplete = useCallback(() => {
    if (integrateAdvanceRef.current) return;
    integrateAdvanceRef.current = true;
    setBriefIntegrateDone(true);
    setBriefStep('decide');
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
