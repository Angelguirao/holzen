import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import {
  briefSwitchToDeepPauseState,
  type BriefPauseStep,
  type RitualDepth,
} from '@/features/pause/public';
import { logPauseRitualDepthUpgraded } from '@/features/pause/public-rpc';

export interface UsePauseSessionBriefToDeepParams {
  subLoading: boolean;
  subscribed: boolean;
  ritualEntry: RitualDepth | 'picker';
  pauseInstanceId: string | null | undefined;
  t: TFunction;
  requirePro: (feature: 'deep_pause') => boolean;
  setRitualEntry: Dispatch<SetStateAction<RitualDepth | 'picker'>>;
  setSwipeDirection: (dir: 'forward' | 'back') => void;
  setStep: Dispatch<SetStateAction<PauseStep>>;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
  setBriefIntegrateDone: Dispatch<SetStateAction<boolean>>;
  setBreathingFirstCompleted: Dispatch<SetStateAction<boolean>>;
  setBreathingSecondCompleted: Dispatch<SetStateAction<boolean>>;
  setBreathTimedActive: Dispatch<SetStateAction<boolean>>;
  setBreathFirstTimedPatternStarted: Dispatch<SetStateAction<boolean>>;
  setFrameDone: Dispatch<SetStateAction<boolean>>;
  setMoodAfterDone: Dispatch<SetStateAction<boolean>>;
}

/**
 * Brief → deep upgrade from Integrate, plus guard that resets deep entry when subscription lapses.
 */
export function usePauseSessionBriefToDeep({
  subLoading,
  subscribed,
  ritualEntry,
  pauseInstanceId,
  t,
  requirePro,
  setRitualEntry,
  setSwipeDirection,
  setStep,
  setBriefStep,
  setBriefIntegrateDone,
  setBreathingFirstCompleted,
  setBreathingSecondCompleted,
  setBreathTimedActive,
  setBreathFirstTimedPatternStarted,
  setFrameDone,
  setMoodAfterDone,
}: UsePauseSessionBriefToDeepParams) {
  useEffect(() => {
    if (subLoading) return;
    if (ritualEntry !== 'deep') return;
    if (subscribed) return;
    setRitualEntry('picker');
  }, [subLoading, subscribed, ritualEntry, setRitualEntry]);

  const handleBriefSwitchToDeepPause = useCallback(async () => {
    if (!requirePro('deep_pause')) return;
    if (pauseInstanceId) {
      const ok = await logPauseRitualDepthUpgraded(pauseInstanceId, t);
      if (!ok) return;
    }
    const next = briefSwitchToDeepPauseState();
    setSwipeDirection('forward');
    setRitualEntry(next.ritualEntry);
    setStep(next.step);
    setBriefStep(next.briefStep);
    setBriefIntegrateDone(next.briefIntegrateDone);
    setBreathingFirstCompleted(next.breathingFirstCompleted);
    setBreathingSecondCompleted(next.breathingSecondCompleted);
    setBreathTimedActive(next.breathTimedActive);
    setBreathFirstTimedPatternStarted(next.breathFirstTimedPatternStarted);
    setFrameDone(next.frameDone);
    setMoodAfterDone(next.moodAfterDone);
  }, [
    requirePro,
    pauseInstanceId,
    t,
    setSwipeDirection,
    setRitualEntry,
    setStep,
    setBriefStep,
    setBriefIntegrateDone,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setBreathTimedActive,
    setBreathFirstTimedPatternStarted,
    setFrameDone,
    setMoodAfterDone,
  ]);

  return { handleBriefSwitchToDeepPause };
}
