import type { RefObject } from 'react';
import type { MarketQuote } from '@/features/market/public';
import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { BriefPauseStep } from '@/features/pause/domain/ritual-types';
import type {
  CurrentFeelForReflect,
  ReflectionContentV2,
} from '../../domain/reflect/generation/reflection-content-v2';
import type { FeelStepTile } from '../../domain/feel-step-tile';
import type { MoodValue } from '../../domain/mood-value';
import type { PauseSessionStepTransitionConfig } from './pause-session-step-transition-io';
import type { PauseBreathingHandle } from '@/features/pause/presentation/session/breath/pause-breathing-handle';

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
  ritualSoundMuted: boolean;
  briefIntegrateDone: boolean;
  onBriefIntegrateComplete: () => void;
  onBriefRepeatBreaths: () => void;
  onBriefSwitchToDeepPause: () => void;
  deepPauseLocked: boolean;
  onDecide: (decision: string) => void;
  onBriefDecideBack: () => void;
  marketData: MarketQuote | null;
  trackedAssetId: string;
  context: string | null;
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
  /** Deep second Breathe intro only — optional skip to Decide (XP bonus when not skipped). */
  onSkipSecondBreath: () => void;
  ritualSoundMuted: boolean;
  prefersReducedMotion: boolean;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  pauseInstanceId: string | null;
  context: string | null;
  marketData: MarketQuote | null;
  trackedAssetId: string;
  reflectionMessage: string;
  reflectionContent?: ReflectionContentV2 | null;
  currentFeel?: CurrentFeelForReflect;
  severityAbsPct?: number;
  reflectionLoading?: boolean;
  reflectionError?: string | null;
  onReflectionRetry?: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void | Promise<void>;
  subscribed: boolean;
  mood?: MoodValue | null;
  selectedShiftMood: MoodValue | null;
  onSelectShiftMood: (mood: MoodValue) => void;
  onFrameImDone: () => void;
  onDecide: (decision: string) => void;
  onRepeatDeepFirstBreathPattern: () => void;
  onRepeatDeepSecondBreathPattern: () => void;
};
