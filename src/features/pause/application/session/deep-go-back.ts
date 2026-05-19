import { STEPS, type PauseStep } from '@/screens/pause/components/PauseProgress';

/**
 * Previous deep-ritual step in `STEPS` order, or `null` on the first step.
 * Matches the non-brief branch of `goBack` in `PauseSession`.
 */
export function computeDeepRitualGoBackTarget(current: PauseStep): PauseStep | null {
  const i = STEPS.indexOf(current);
  if (i <= 0) return null;
  return STEPS[i - 1]!;
}
