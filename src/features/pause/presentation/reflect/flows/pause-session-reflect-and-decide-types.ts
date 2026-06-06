import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { MarketQuote } from '@/features/market/public';
import type { PauseImpactData } from '@/features/pause/presentation/session/pause-session-decide-io';
import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';
import type { MoodValue } from '@/features/pause/domain/mood-value';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { RitualDepth } from '@/features/pause/domain/ritual-types';

/** Params for deep ritual reflection + decide completion in the session conductor. */
export type UsePauseSessionReflectAndDecideParams = {
  t: TFunction;
  ritualEntry: RitualDepth | 'picker';
  step: PauseStep;
  pauseInstanceId: string | null;
  context: string | null;
  message: string;
  marketData: MarketQuote | null;
  companionsHaiku: string | null;
  dismissMessage: () => void | Promise<void>;
  refreshSubscription: () => void | Promise<void>;
  setDecision: Dispatch<SetStateAction<string | null>>;
  setPauseImpactData: Dispatch<SetStateAction<PauseImpactData | null>>;
  setPhase: Dispatch<SetStateAction<'session' | 'done'>>;
  selectedMood: MoodValue | null;
  selectedBriefFace: FeelStepTile | null;
  selectedMoodAfter: MoodValue | null;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  feelIntensity: number | null;
  shiftIntensity: number | null;
};
