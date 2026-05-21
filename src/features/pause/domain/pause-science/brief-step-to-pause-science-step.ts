import type { PauseStep } from '../pause-ritual-steps';
import type { BriefPauseStep } from '../ritual-types';

/** Brief “Integrate” has no dedicated citations row — highlight Reflect (regulation) sources. */
export function briefStepToPauseScienceStep(brief: BriefPauseStep): PauseStep {
  switch (brief) {
    case 'feel':
      return 'feel';
    case 'breath':
      return 'breathe';
    case 'integrate':
      return 'reflect';
    case 'decide':
      return 'decide';
  }
}
