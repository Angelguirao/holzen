/** Re-exported for tests; canonical definition in `pause-breathing-pattern.ts`. */
export { BOX_BREATH_PHASE_COUNT } from '@/lib/pause-breathing-pattern';

/**
 * Parent `completed` is false while the segment is in progress; session-local completion
 * must still surface the post-pattern UI. Do not use `??` here — `false ?? local` ignores local.
 */
export function resolveBreathingCompleted(
  completedProp: boolean | undefined,
  completedLocal: boolean,
): boolean {
  return (completedProp ?? false) || completedLocal;
}

export type BreathingPhaseAdvanceResult =
  | { kind: 'tick' }
  | { kind: 'next_phase'; nextPhaseIndex: number }
  | { kind: 'next_cycle'; nextCycle: number }
  | { kind: 'pattern_complete' };

/**
 * Given elapsed seconds in the current phase, returns how the timed loop should advance.
 * Used by `PauseBreathing` (see tests for round 3 / final hold completion).
 */
export function computeBreathingPhaseAdvance(input: {
  elapsed: number;
  phaseDuration: number;
  phaseIndex: number;
  phaseCount: number;
  cycle: number;
  totalCycles: number;
}): BreathingPhaseAdvanceResult {
  const { elapsed, phaseDuration, phaseIndex, phaseCount, cycle, totalCycles } = input;
  if (elapsed < phaseDuration) return { kind: 'tick' };

  const nextPhase = phaseIndex + 1;
  if (nextPhase >= phaseCount) {
    const nextCycle = cycle + 1;
    if (nextCycle >= totalCycles) return { kind: 'pattern_complete' };
    return { kind: 'next_cycle', nextCycle };
  }
  return { kind: 'next_phase', nextPhaseIndex: nextPhase };
}
