import type { RefObject } from 'react';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { MoodValue } from '@/components/MoodCheck';
import type { FeelStepTile } from '@/components/pause/pause-feel-types';
import type { PauseBreathingHandle } from '@/components/pause/PauseBreathing';
import type { PauseSessionBriefRitualBodyProps } from '@/components/pause/PauseSessionBriefRitualBody';
import type { PauseSessionDeepRitualBodyProps } from '@/components/pause/PauseSessionDeepRitualBody';
import type { PauseStep } from '@/components/pause/PauseProgress';
import type { BriefPauseStep } from '@/lib/pause-session-storage';
import type { PauseSessionStepTransitionConfig } from '@/lib/pause-session-step-transition';

/**
 * Assembles `briefRitual` / `deepRitual` props for `PauseSessionScaffoldShell` from the `PauseSession` route.
 *
 * **Ritual semantics:** `docs/systems/pause-system.md` (client ritual, sections 7–7.3; brief vs deep RPC order).
 * **Code map:** same doc, section 10 (Related docs and code).
 */

/** Parameter bag for `buildPauseSessionScaffoldRitualPayloads`. */
export type PauseSessionScaffoldRitualPayloadsParams = {
  briefStep: BriefPauseStep;
  step: PauseStep;
  stepTransition: PauseSessionStepTransitionConfig;
  moodDone: boolean;
  selectedMood: MoodValue | null;
  selectedBriefFace: FeelStepTile | null;
  feelIntensity: number | null;
  onFeelTilesSelect: PauseSessionBriefRitualBodyProps['onFeelTilesSelect'];
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
  prefersReducedMotion: boolean;
  briefIntegrateDone: boolean;
  handleBriefIntegrateComplete: PauseSessionBriefRitualBodyProps['onBriefIntegrateComplete'];
  handleBriefRepeatBreaths: PauseSessionBriefRitualBodyProps['onBriefRepeatBreaths'];
  handleBriefSwitchToDeepPause: PauseSessionBriefRitualBodyProps['onBriefSwitchToDeepPause'];
  handleDecide: PauseSessionBriefRitualBodyProps['onDecide'];
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
  handleDeepFirstBreathRepeat: PauseSessionDeepRitualBodyProps['onRepeatDeepFirstBreathPattern'];
  handleDeepSecondBreathRepeat: PauseSessionDeepRitualBodyProps['onRepeatDeepSecondBreathPattern'];
  severityAbsPct: number;
  reflectionLoading: boolean;
  reflectionError: string | null;
  onReflectionRetry: PauseSessionDeepRitualBodyProps['onReflectionRetry'];
};

/** Maps orchestrator deps to `PauseSessionBriefRitualBodyProps` and `PauseSessionDeepRitualBodyProps`. */
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
      onFeelTilesSelect: p.onFeelTilesSelect,
      onBriefFeelContinueToBreath: () => p.setBriefStep('breath'),
      breathingRef: p.breathingRef,
      mantra: p.mantra,
      severity: p.severity,
      breathingFirstCompleted: p.breathingFirstCompleted,
      onTimedBreathingChange: p.setBreathTimedActive,
      /** Brief: first segment “completed” is set after `breath_completed` RPC in `handleBriefBreathContinue`. */
      onBriefBreathPatternComplete: () => {},
      onContinueAfterBriefBreath: () => void p.handleBriefBreathContinue(),
      onSkipBriefBreath: p.handleBriefSkipBreath,
      ritualSoundMuted: p.soundMuted,
      briefIntegrateDone: p.briefIntegrateDone,
      onBriefIntegrateComplete: p.handleBriefIntegrateComplete,
      onBriefRepeatBreaths: p.handleBriefRepeatBreaths,
      onBriefSwitchToDeepPause: p.handleBriefSwitchToDeepPause,
      deepPauseLocked: !p.subscribed,
      onDecide: p.handleDecide,
      onBriefDecideBack: () => p.setBriefStep('integrate'),
    },
    deepRitual: {
      step: p.step,
      stepTransition: p.stepTransition,
      moodDone: p.moodDone,
      selectedMood: p.selectedMood,
      selectedBriefFace: p.selectedBriefFace,
      feelIntensity: p.feelIntensity,
      onFeelTilesSelect: p.onFeelTilesSelect,
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
      prefersReducedMotion: p.prefersReducedMotion,
      companions: p.companions,
      companionPrefs: p.companionPrefs,
      pauseInstanceId: p.pauseInstanceId,
      context: p.context,
      reflectionMessage: p.message,
      isFavorite: p.isFavorite,
      onToggleFavorite: p.toggleFavorite,
      subscribed: p.subscribed,
      onFrameImDone: () => void p.handleFrameImDone(),
      onDecide: p.handleDecide,
      onRepeatDeepFirstBreathPattern: p.handleDeepFirstBreathRepeat,
      onRepeatDeepSecondBreathPattern: p.handleDeepSecondBreathRepeat,
      reflectionLoading: p.reflectionLoading,
      reflectionError: p.reflectionError,
      onReflectionRetry: p.onReflectionRetry,
    },
  };
}
