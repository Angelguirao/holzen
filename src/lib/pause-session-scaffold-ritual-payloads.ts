import type { RefObject } from 'react';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { MoodValue } from '@/components/MoodCheck';
import type { BriefFeelTile } from '@/components/pause/PauseBriefFeel';
import type { PauseBreathingHandle } from '@/components/pause/PauseBreathing';
import type { PauseSessionBriefRitualBodyProps } from '@/components/pause/PauseSessionBriefRitualBody';
import type { PauseSessionDeepRitualBodyProps } from '@/components/pause/PauseSessionDeepRitualBody';
import type { PauseStep } from '@/components/pause/PauseProgress';
import type { BriefPauseStep } from '@/lib/pause-session-storage';
import type { PauseSessionStepTransitionConfig } from '@/lib/pause-session-step-transition';

/** Inputs for `briefRitual` / `deepRitual` props on `PauseSessionScaffoldShell` (assembled in `PauseSession`). */
export type PauseSessionScaffoldRitualPayloadsParams = {
  briefStep: BriefPauseStep;
  step: PauseStep;
  stepTransition: PauseSessionStepTransitionConfig;
  moodDone: boolean;
  selectedMood: MoodValue | null;
  selectedBriefFace: BriefFeelTile | null;
  feelIntensity: number | null;
  onBriefFeelSelect: PauseSessionBriefRitualBodyProps['onBriefFeelSelect'];
  setBriefStep: (next: BriefPauseStep) => void;
  breathingRef: RefObject<PauseBreathingHandle | null>;
  mantra: string | null;
  severity: 'mild' | 'moderate' | 'high';
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  setBreathTimedActive: PauseSessionBriefRitualBodyProps['onTimedBreathingChange'];
  setBreathingFirstCompleted: (done: boolean) => void;
  setBreathingSecondCompleted: (done: boolean) => void;
  handleBriefBreathContinue: () => void | Promise<unknown>;
  handleBriefSkipBreath: PauseSessionBriefRitualBodyProps['onSkipBriefBreath'];
  soundMuted: boolean;
  briefIntegrateDone: boolean;
  handleBriefIntegrateComplete: PauseSessionBriefRitualBodyProps['onBriefIntegrateComplete'];
  handleDecide: PauseSessionBriefRitualBodyProps['onDecide'];
  briefDecideIntroKicker: string;
  handleMoodSelect: PauseSessionDeepRitualBodyProps['onMoodSelect'];
  handleMoodSkip: PauseSessionDeepRitualBodyProps['onMoodSkip'];
  handleMoodReset: PauseSessionDeepRitualBodyProps['onMoodReset'];
  goToStep: PauseSessionDeepRitualBodyProps['goToStep'];
  handleContinueAfterFirstBreath: () => void | Promise<unknown>;
  handleContinueAfterSecondBreath: () => void | Promise<unknown>;
  handleSkipFirstBreath: PauseSessionDeepRitualBodyProps['onSkipFirstBreath'];
  handleSkipSecondBreath: PauseSessionDeepRitualBodyProps['onSkipSecondBreath'];
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  pauseInstanceId: string | null;
  context: string | null;
  message: string;
  isFavorite: boolean;
  toggleFavorite: PauseSessionDeepRitualBodyProps['onToggleFavorite'];
  subscribed: boolean;
  handleFrameImDone: () => void | Promise<unknown>;
  handleDeepChooseBridgeContinue: PauseSessionDeepRitualBodyProps['onDeepChooseBridgeContinue'];
  decideOnBackStep: PauseSessionDeepRitualBodyProps['decideOnBackStep'];
};

export function buildPauseSessionScaffoldRitualPayloads(
  p: PauseSessionScaffoldRitualPayloadsParams,
): {
  briefRitual: PauseSessionBriefRitualBodyProps;
  deepRitual: PauseSessionDeepRitualBodyProps;
} {
  return {
    briefRitual: {
      briefStep: p.briefStep,
      stepTransition: p.stepTransition,
      moodDone: p.moodDone,
      selectedMood: p.selectedMood,
      selectedBriefFace: p.selectedBriefFace,
      feelIntensity: p.feelIntensity,
      onBriefFeelSelect: p.onBriefFeelSelect,
      onBriefFeelContinueToBreath: () => p.setBriefStep('breath'),
      breathingRef: p.breathingRef,
      mantra: p.mantra,
      severity: p.severity,
      breathingFirstCompleted: p.breathingFirstCompleted,
      onTimedBreathingChange: p.setBreathTimedActive,
      onBriefBreathPatternComplete: () => p.setBreathingFirstCompleted(true),
      onContinueAfterBriefBreath: () => void p.handleBriefBreathContinue(),
      onSkipBriefBreath: p.handleBriefSkipBreath,
      ritualSoundMuted: p.soundMuted,
      briefIntegrateDone: p.briefIntegrateDone,
      onBriefIntegrateComplete: p.handleBriefIntegrateComplete,
      onDecide: p.handleDecide,
      onBriefDecideBack: () => p.setBriefStep('integrate'),
      briefDecideIntroKicker: p.briefDecideIntroKicker,
    },
    deepRitual: {
      step: p.step,
      stepTransition: p.stepTransition,
      onMoodSelect: p.handleMoodSelect,
      onMoodSkip: p.handleMoodSkip,
      onMoodReset: p.handleMoodReset,
      moodDone: p.moodDone,
      selectedMood: p.selectedMood,
      feelIntensity: p.feelIntensity,
      goToStep: p.goToStep,
      breathingRef: p.breathingRef,
      mantra: p.mantra,
      severity: p.severity,
      breathingFirstCompleted: p.breathingFirstCompleted,
      breathingSecondCompleted: p.breathingSecondCompleted,
      onTimedBreathingChange: p.setBreathTimedActive,
      onFirstBreathPatternComplete: () => p.setBreathingFirstCompleted(true),
      onSecondBreathPatternComplete: () => p.setBreathingSecondCompleted(true),
      onContinueAfterFirstBreath: () => void p.handleContinueAfterFirstBreath(),
      onContinueAfterSecondBreath: () => void p.handleContinueAfterSecondBreath(),
      onSkipFirstBreath: p.handleSkipFirstBreath,
      onSkipSecondBreath: p.handleSkipSecondBreath,
      ritualSoundMuted: p.soundMuted,
      companions: p.companions,
      companionPrefs: p.companionPrefs,
      pauseInstanceId: p.pauseInstanceId,
      context: p.context,
      reflectionMessage: p.message,
      isFavorite: p.isFavorite,
      onToggleFavorite: p.toggleFavorite,
      subscribed: p.subscribed,
      onFrameImDone: () => void p.handleFrameImDone(),
      onDeepChooseBridgeContinue: p.handleDeepChooseBridgeContinue,
      onDecide: p.handleDecide,
      decideOnBackStep: p.decideOnBackStep,
    },
  };
}
