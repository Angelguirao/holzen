import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type {
  BriefPauseStep,
  CompanionData,
  CompanionPrefs,
  PauseStep,
  RitualDepth,
} from '@/features/pause/public-hooks';
import type { FeelStepTile } from '../../domain/feel-step-tile';
import type { MoodValue } from '../../domain/mood-value';
import type { PauseSessionBreathReflectProvidersSlice } from '../reflect/flows/pause-session-breath-reflect-handler-types';

export type {
  PauseSessionBreathReflectMoodSlice,
  PauseSessionBreathReflectProvidersSlice,
  PauseSessionBreathReflectRitualSlice,
  PauseSessionBreathReflectShellSlice,
} from '../reflect/flows/pause-session-breath-reflect-handler-types';

/** Subset of `usePauseSessionProviders` passed into mood chrome handlers. */
export type PauseSessionMoodChromeProvidersSlice = {
  t: TFunction;
  handleReturn: () => void;
  subscribed: boolean;
  requirePro: (feature: 'deep_pause') => boolean;
};

/** Subset of shell bootstrap passed into mood chrome handlers. */
export type PauseSessionMoodChromeShellSlice = {
  message: string;
  context: string | null;
  pauseInstanceId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
  requestExitPauseBeforeDone: () => void;
};

/** Subset of ritual state passed into mood chrome handlers. */
export type PauseSessionMoodChromeRitualSlice = {
  phase: 'session' | 'done';
  ritualEntry: RitualDepth | 'picker';
  moodDone: boolean;
  moodAfterDone: boolean;
  selectedMood: MoodValue | null;
  selectedMoodAfter: MoodValue | null;
  feelIntensity: number | null;
  shiftIntensity: number | null;
  decision: string | null;
  step: PauseStep;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  frameDone: boolean;
  briefStep: BriefPauseStep;
  briefIntegrateDone: boolean;
  selectedBriefFace: FeelStepTile | null;
  isFavorite: boolean;
  setIsFavorite: Dispatch<SetStateAction<boolean>>;
  setRitualEntry: Dispatch<SetStateAction<RitualDepth | 'picker'>>;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
  setBriefIntegrateDone: Dispatch<SetStateAction<boolean>>;
  setSelectedBriefFace: Dispatch<SetStateAction<FeelStepTile | null>>;
  setMoodDone: Dispatch<SetStateAction<boolean>>;
  setSelectedMood: Dispatch<SetStateAction<MoodValue | null>>;
  setFeelIntensity: Dispatch<SetStateAction<number | null>>;
};

/** Provider fields for mood + breath/reflect step handlers (subset of `usePauseSessionProviders`). */
export type PauseSessionStepHandlersProvidersSlice = PauseSessionMoodChromeProvidersSlice &
  PauseSessionBreathReflectProvidersSlice;
