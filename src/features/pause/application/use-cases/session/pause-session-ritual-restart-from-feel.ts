import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { BriefPauseStep } from '@/features/pause/domain/ritual-types';
import type { MoodValue } from '@/features/pause/domain/mood-value';

/** Client snapshot when restarting the in-session ritual at Feel (same depth). */
export type PauseSessionRitualRestartFromFeelPatch = {
  step: PauseStep;
  briefStep: BriefPauseStep;
  phase: 'session';
  moodDone: boolean;
  moodAfterDone: boolean;
  selectedMood: MoodValue | null;
  selectedMoodAfter: MoodValue | null;
  feelIntensity: number | null;
  shiftIntensity: number | null;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  frameDone: boolean;
  briefIntegrateDone: boolean;
  decision: string | null;
  swipeDirection: 'forward' | 'back';
};

export function pauseSessionRitualRestartFromFeelPatch(): PauseSessionRitualRestartFromFeelPatch {
  return {
    step: 'feel',
    briefStep: 'feel',
    phase: 'session',
    moodDone: false,
    moodAfterDone: false,
    selectedMood: null,
    selectedMoodAfter: null,
    feelIntensity: null,
    shiftIntensity: null,
    breathingFirstCompleted: false,
    breathingSecondCompleted: false,
    frameDone: false,
    briefIntegrateDone: false,
    decision: null,
    swipeDirection: 'forward',
  };
}
