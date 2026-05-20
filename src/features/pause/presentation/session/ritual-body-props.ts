import type { RefObject } from 'react';
import type {
  BriefPauseStep,
  CompanionData,
  CompanionPrefs,
  PauseStep,
} from '@/features/pause/public';
import type { FeelStepTile } from '../../domain/feel-step-tile';
import type { MoodValue } from '../../domain/mood-value';
import type { PauseSessionStepTransitionConfig } from '@/features/pause/application/use-cases/session/step-transition';
import type { PauseBreathingHandle } from '@/features/pause/presentation/session/pause-breathing-handle';

/** Props for `PauseSessionBriefRitualBody` (pause screen presentation). */
export type PauseSessionBriefRitualBodyProps = {
  briefStep: BriefPauseStep;
  stepTransition: PauseSessionStepTransitionConfig;
  moodDone: boolean;
  selectedMood: MoodValue | null;
  selectedBriefFace: FeelStepTile | null;
  feelIntensity: number | null;
  onFeelTilesSelect: (mood: MoodValue, intensity: number, tile: FeelStepTile) => void;
  onBriefFeelContinueToBreath: () => void;
  breathingRef: RefObject<PauseBreathingHandle | null>;
  mantra: string | null;
  severity: 'mild' | 'moderate' | 'high';
  breathingFirstCompleted: boolean;
  onTimedBreathingChange: (active: boolean) => void;
  onBriefBreathPatternComplete: () => void;
  onContinueAfterBriefBreath: () => void;
  onSkipBriefBreath: () => void;
  ritualSoundMuted: boolean;
  briefIntegrateDone: boolean;
  onBriefIntegrateComplete: () => void;
  onBriefRepeatBreaths: () => void;
  onBriefSwitchToDeepPause: () => void;
  deepPauseLocked: boolean;
  onDecide: (decision: string) => void;
  onBriefDecideBack: () => void;
};

/** Props for `PauseSessionDeepRitualBody` (pause screen presentation). */
export type PauseSessionDeepRitualBodyProps = {
  step: PauseStep;
  stepTransition: PauseSessionStepTransitionConfig;
  moodDone: boolean;
  selectedMood: MoodValue | null;
  selectedBriefFace: FeelStepTile | null;
  feelIntensity: number | null;
  onFeelTilesSelect: (mood: MoodValue, intensity: number, tile: FeelStepTile) => void;
  goToStep: (next: PauseStep) => void;
  breathingRef: RefObject<PauseBreathingHandle | null>;
  mantra: string | null;
  severity: 'mild' | 'moderate' | 'high';
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  onTimedBreathingChange: (active: boolean) => void;
  onFirstBreathPatternComplete: () => void;
  onSecondBreathPatternComplete: () => void;
  onContinueAfterFirstBreath: () => void;
  onContinueAfterSecondBreath: () => void;
  onSkipFirstBreath: () => void;
  onSkipSecondBreath: () => void;
  ritualSoundMuted: boolean;
  prefersReducedMotion: boolean;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  pauseInstanceId: string | null;
  context: string | null;
  reflectionMessage: string;
  reflectionLoading?: boolean;
  reflectionError?: string | null;
  onReflectionRetry?: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void | Promise<void>;
  subscribed: boolean;
  onFrameImDone: () => void;
  onDecide: (decision: string) => void;
  onRepeatDeepFirstBreathPattern: () => void;
  onRepeatDeepSecondBreathPattern: () => void;
};
