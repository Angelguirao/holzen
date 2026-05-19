import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { RitualDepth } from '@/features/pause/domain/ritual-types';

/**
 * When deep ritual may call `holzen-reflect` (see pause-system §7.1).
 * Enabled on Reflect, Frame, second Breathe, and Decide — not only on the Reflect card.
 */
export function isPauseReflectGenerationEnabled(
  ritualEntry: RitualDepth | 'picker',
  step: PauseStep,
): boolean {
  return (
    ritualEntry === 'deep' &&
    (step === 'reflect' || step === 'frame' || step === 'breath2' || step === 'decide')
  );
}
