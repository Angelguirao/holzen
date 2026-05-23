import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';

/**
 * Whether an implicit “advance to next step” gesture may leave the current pause step.
 * Mirrors the same gates as each step’s primary Continue affordance (the `/pause` ritual does not use horizontal swipe).
 */
export function canAdvanceFromPauseStep(params: {
  step: PauseStep;
  /** First breathing segment (after Feel) complete */
  breathingFirstCompleted: boolean;
  /** Second breathing segment (after Frame) complete */
  breathingSecondCompleted: boolean;
  moodDone: boolean;
  /** Frame hub finished (“I'm done”) */
  frameDone: boolean;
}): boolean {
  switch (params.step) {
    case 'feel':
      return params.moodDone;
    case 'breathe':
      return params.breathingFirstCompleted;
    case 'reflect':
      return true;
    case 'frame':
      return params.frameDone;
    case 'breath2':
      return params.breathingSecondCompleted;
    case 'decide':
      return false;
    default:
      return false;
  }
}
