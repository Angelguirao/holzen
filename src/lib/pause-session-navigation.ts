import type { PauseStep } from '@/components/pause/PauseProgress';

/**
 * Whether a left-swipe / “next step” gesture may leave the current pause step.
 * Mirrors the same gates as each step’s primary Continue affordance.
 */
export function canAdvanceFromPauseStep(params: {
  step: PauseStep;
  breathingCompleted: boolean;
  moodDone: boolean;
  moodAfterDone: boolean;
}): boolean {
  switch (params.step) {
    case 'breathe':
      return params.breathingCompleted;
    case 'feel':
      return params.moodDone;
    case 'reflect':
      return true;
    case 'shift':
      return params.moodAfterDone;
    case 'decide':
      return false;
    default:
      return false;
  }
}
