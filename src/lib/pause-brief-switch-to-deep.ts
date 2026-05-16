import type { PauseStep } from '@/components/pause/PauseProgress';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';

/** Deep ritual step after brief Integrate → deep (first breathe already logged on the brief path). */
export const BRIEF_SWITCH_TO_DEEP_STEP: PauseStep = 'reflect';

export type BriefSwitchToDeepPauseState = {
  ritualEntry: RitualDepth;
  step: PauseStep;
  briefStep: BriefPauseStep;
  briefIntegrateDone: boolean;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  breathTimedActive: boolean;
  breathFirstTimedPatternStarted: boolean;
  frameDone: boolean;
  moodAfterDone: boolean;
};

/** Client snapshot when the user upgrades from brief Integrate to the deep ritual. */
export function briefSwitchToDeepPauseState(): BriefSwitchToDeepPauseState {
  return {
    ritualEntry: 'deep',
    step: BRIEF_SWITCH_TO_DEEP_STEP,
    briefStep: 'feel',
    briefIntegrateDone: false,
    breathingFirstCompleted: true,
    breathingSecondCompleted: false,
    breathTimedActive: false,
    breathFirstTimedPatternStarted: false,
    frameDone: false,
    moodAfterDone: false,
  };
}
