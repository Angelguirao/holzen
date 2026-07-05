import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { BriefPauseStep } from '@/features/pause/domain/ritual-types';

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
