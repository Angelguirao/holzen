/** Box pattern: inhale, hold, exhale, hold — four phases per cycle. */
export const BOX_BREATH_PHASE_COUNT = 4;

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
