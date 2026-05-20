import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import type { BriefPauseStep, PersistedSession, RitualDepth } from '@/features/pause/public';
import { usePauseBreathSegmentRpcLoggers } from '@/features/pause/public-hooks';
import { usePauseSessionBreathNavigation } from '@/screens/pause/hooks/use-pause-session-breath-navigation';
import { usePauseSessionBreathStepHandlers } from '@/screens/pause/hooks/use-pause-session-breath-step-handlers';
import { usePauseSessionBriefToDeep } from '@/features/pause/public-hooks';

export interface UsePauseSessionBreathHandlersParams {
  pauseInstanceId: string | null;
  restored: PersistedSession | null;
  t: TFunction;
  subLoading: boolean;
  subscribed: boolean;
  requirePro: (feature: 'deep_pause') => boolean;
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
  setRitualEntry: Dispatch<SetStateAction<RitualDepth | 'picker'>>;
  setFrameDone: Dispatch<SetStateAction<boolean>>;
  setMoodAfterDone: Dispatch<SetStateAction<boolean>>;
}

/**
 * Breath segment RPC loggers, step navigation, timed breath UI, header back, brief→deep upgrade.
 */
export function usePauseSessionBreathHandlers(params: UsePauseSessionBreathHandlersParams) {
  const {
    pauseInstanceId,
    restored,
    t,
    subLoading,
    subscribed,
    requirePro,
    ritualEntry,
    setRitualEntry,
    setSwipeDirection,
    setStep,
    setBriefStep,
    setBriefIntegrateDone,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setFrameDone,
    setMoodAfterDone,
  } = params;

  const {
    ensureBreathSegment1Logged,
    ensureBreathSegment2Logged,
    logBreathSegment1Skipped,
    logBreathSegment2Skipped,
  } = usePauseBreathSegmentRpcLoggers({
    pauseInstanceId,
    restored,
    t,
  });

  const navigation = usePauseSessionBreathNavigation(params);

  const {
    handleContinueAfterFirstBreath,
    handleContinueAfterSecondBreath,
    handleSkipFirstBreath,
    handleSkipSecondBreath,
    handleBriefBreathContinue,
    handleBriefSkipBreath,
    handleBriefIntegrateComplete,
  } = usePauseSessionBreathStepHandlers({
    goToStep: navigation.goToStep,
    ritualEntry: params.ritualEntry,
    briefStep: params.briefStep,
    ensureBreathSegment1Logged,
    ensureBreathSegment2Logged,
    logBreathSegment1Skipped,
    logBreathSegment2Skipped,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setBriefStep,
    setBriefIntegrateDone,
  });

  const { handleBriefSwitchToDeepPause } = usePauseSessionBriefToDeep({
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
    setBreathTimedActive: navigation.setBreathTimedActiveInner,
    setBreathFirstTimedPatternStarted: navigation.setBreathFirstTimedPatternStarted,
    setFrameDone,
    setMoodAfterDone,
  });

  return {
    goToStep: navigation.goToStep,
    breathingRef: navigation.breathingRef,
    breathTimedActive: navigation.breathTimedActive,
    trackBreathTimedActive: navigation.trackBreathTimedActive,
    handleBriefRepeatBreaths: navigation.handleBriefRepeatBreaths,
    handleDeepFirstBreathRepeat: navigation.handleDeepFirstBreathRepeat,
    handleDeepSecondBreathRepeat: navigation.handleDeepSecondBreathRepeat,
    handlePauseHeaderBack: navigation.handlePauseHeaderBack,
    showPauseHeaderBack: navigation.showPauseHeaderBack,
    handleContinueAfterFirstBreath,
    handleContinueAfterSecondBreath,
    handleSkipFirstBreath,
    handleSkipSecondBreath,
    handleBriefBreathContinue,
    handleBriefSkipBreath,
    handleBriefIntegrateComplete,
    handleBriefSwitchToDeepPause,
  };
}
