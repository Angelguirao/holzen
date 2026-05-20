import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/features/market/public';
import type {
  BriefPauseStep,
  CompanionData,
  CompanionPrefs,
  MoodValue,
  PauseImpactData,
  PauseStep,
  PersistedSession,
  RitualDepth,
  FeelStepTile,
} from '@/features/pause/public';

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

/** Subset of `usePauseSessionProviders` passed into breath/reflect handlers. */
export type PauseSessionBreathReflectProvidersSlice = {
  t: TFunction;
  dismissMessage: () => void | Promise<void>;
  btcData: BtcPriceData | null;
  subscribed: boolean;
  subLoading: boolean;
  requirePro: (feature: 'deep_pause') => boolean;
  refreshSubscription: () => void | Promise<void>;
};

/** Subset of shell bootstrap passed into breath/reflect handlers. */
export type PauseSessionBreathReflectShellSlice = {
  restored: PersistedSession | null;
  message: string;
  context: string | null;
  pauseInstanceId: string | null;
  companions: CompanionData;
};

/** Subset of ritual state passed into breath/reflect handlers. */
export type PauseSessionBreathReflectRitualSlice = {
  step: PauseStep;
  phase: 'session' | 'done';
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  selectedMood: MoodValue | null;
  selectedMoodAfter: MoodValue | null;
  feelIntensity: number | null;
  shiftIntensity: number | null;
  setSwipeDirection: Dispatch<SetStateAction<'forward' | 'back'>>;
  setStep: Dispatch<SetStateAction<PauseStep>>;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
  setBriefIntegrateDone: Dispatch<SetStateAction<boolean>>;
  setBreathingFirstCompleted: Dispatch<SetStateAction<boolean>>;
  setBreathingSecondCompleted: Dispatch<SetStateAction<boolean>>;
  setRitualEntry: Dispatch<SetStateAction<RitualDepth | 'picker'>>;
  setFrameDone: Dispatch<SetStateAction<boolean>>;
  setMoodAfterDone: Dispatch<SetStateAction<boolean>>;
  setDecision: Dispatch<SetStateAction<string | null>>;
  setPauseImpactData: Dispatch<SetStateAction<PauseImpactData | null>>;
  setPhase: Dispatch<SetStateAction<'session' | 'done'>>;
};

/** Dedupe refs from `usePauseSessionMoodAndPersist` for shift/frame RPC logging. */
export type PauseSessionBreathReflectMoodSlice = {
  lastShiftLogKeyRef: MutableRefObject<string | null>;
};
