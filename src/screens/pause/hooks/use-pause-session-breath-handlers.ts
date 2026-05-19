import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import {
  isPauseSessionHeaderBackVisible,
  type BriefPauseStep,
  type PersistedSession,
  type RitualDepth,
} from '@/features/pause/public';
import { usePauseBreathSegmentRpcLoggers } from '@/screens/pause/hooks/use-pause-breath-segment-rpc-loggers';
import { usePauseSessionBreathStepHandlers } from '@/screens/pause/hooks/use-pause-session-breath-step-handlers';
import { usePauseSessionBreathUi } from '@/screens/pause/hooks/use-pause-session-breath-ui';
import { usePauseSessionBriefToDeep } from '@/screens/pause/hooks/use-pause-session-brief-to-deep';
import { usePauseSessionGoBack } from '@/screens/pause/hooks/use-pause-session-go-back';
import { usePauseSessionGoToStep } from '@/screens/pause/hooks/use-pause-session-go-to-step';
import { usePauseSessionHeaderBackHandler } from '@/screens/pause/hooks/use-pause-session-header-back-handler';

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
export function usePauseSessionBreathHandlers({
  pauseInstanceId,
  restored,
  t,
  subLoading,
  subscribed,
  requirePro,
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
  setRitualEntry,
  setFrameDone,
  setMoodAfterDone,
}: UsePauseSessionBreathHandlersParams) {
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

  const {
    handleContinueAfterFirstBreath,
    handleContinueAfterSecondBreath,
    handleSkipFirstBreath,
    handleSkipSecondBreath,
    handleBriefBreathContinue,
    handleBriefSkipBreath,
    handleBriefIntegrateComplete,
  } = usePauseSessionBreathStepHandlers({
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
    setBreathTimedActive: setBreathTimedActiveInner,
    setBreathFirstTimedPatternStarted,
    setFrameDone,
    setMoodAfterDone,
  });

  return {
    goToStep,
    breathingRef,
    breathTimedActive,
    trackBreathTimedActive,
    handleBriefRepeatBreaths,
    handleDeepFirstBreathRepeat,
    handleDeepSecondBreathRepeat,
    handlePauseHeaderBack,
    showPauseHeaderBack,
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
