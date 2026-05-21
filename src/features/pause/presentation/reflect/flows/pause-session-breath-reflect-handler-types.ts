import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/features/market/public';
import type { PauseImpactData } from '@/features/pause/public-hooks';
import type { PersistedSession } from '@/features/pause/domain/session-model';
import type {
  BriefPauseStep,
  CompanionData,
  PauseStep,
  RitualDepth,
} from '@/features/pause/public-hooks';
import type { MoodValue } from '@/features/pause/domain/mood-value';

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
