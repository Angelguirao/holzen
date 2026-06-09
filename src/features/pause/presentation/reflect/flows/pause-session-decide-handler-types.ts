import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { PauseImpactData } from '@/features/pause/presentation/session/pause-session-decide-io';
import type { MoodValue } from '@/features/pause/domain/mood-value';
import type { RitualDepth } from '@/features/pause/domain/ritual-types';

/** Params for Decide-step outcome logging and session completion. */
export type UsePauseSessionDecideHandlerParams = {
  decidingRef: MutableRefObject<boolean>;
  pauseInstanceId: string | null;
  t: TFunction;
  refreshSubscription: () => void | Promise<void>;
  setDecision: Dispatch<SetStateAction<string | null>>;
  dismissMessage: () => void | Promise<void>;
  setPauseImpactData: Dispatch<SetStateAction<PauseImpactData | null>>;
  setPhase: Dispatch<SetStateAction<'session' | 'done'>>;
  context: string | null;
  selectedMood: MoodValue | null;
  selectedMoodAfter: MoodValue | null;
  ritualEntry: RitualDepth | 'picker';
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  feelIntensity: number | null;
  shiftIntensity: number | null;
  reflectionMessage: string;
  haiku: string | null;
  ritualStartedAtMs: number | null;
  companionPrefs: CompanionPrefs;
  isFavorite: boolean;
  pauseInstanceMetadata?: unknown;
};
