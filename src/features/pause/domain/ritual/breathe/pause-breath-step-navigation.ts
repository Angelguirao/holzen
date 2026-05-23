import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';

/** Deep ritual: first Breathe segment complete/skip → Reflect. */
export const DEEP_PAUSE_STEP_AFTER_FIRST_BREATH = 'reflect' as const satisfies PauseStep;

/** Deep ritual: second Breathe segment complete/skip → Decide. */
export const DEEP_PAUSE_STEP_AFTER_SECOND_BREATH = 'decide' as const satisfies PauseStep;

/** Brief ritual: Breathe complete/skip → Integrate. */
export const BRIEF_PAUSE_STEP_AFTER_BREATH = 'integrate' as const satisfies BriefPauseStep;

/** Brief ritual: Integrate complete → Decide (brief sub-step, not deep `PauseStep`). */
export const BRIEF_PAUSE_STEP_AFTER_INTEGRATE = 'decide' as const satisfies BriefPauseStep;

/** Payload flag for `breath_completed` on the brief ritual first segment. */
export const BRIEF_FIRST_BREATH_SEGMENT_LOG = { briefRitual: true as const };

/** Re-arm integrate advance when user re-enters the brief Integrate step. */
export function shouldResetBriefIntegrateAdvanceGuard(
  ritualEntry: RitualDepth | 'picker',
  briefStep: BriefPauseStep,
): boolean {
  return ritualEntry === 'brief' && briefStep === 'integrate';
}

/** Guards double-tap on brief Integrate → Decide (presentation keeps a ref). */
export function claimBriefIntegrateAdvance(integrateAdvanceLocked: boolean): {
  canAdvance: boolean;
  nextLocked: boolean;
} {
  if (integrateAdvanceLocked) {
    return { canAdvance: false, nextLocked: true };
  }
  return { canAdvance: true, nextLocked: true };
}
