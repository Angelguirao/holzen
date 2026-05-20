export { BOX_BREATH_PHASE_COUNT } from '@/features/pause/application/use-cases/ritual/breathe/breathing-constants';

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

export type BreathingTimedLoopState = {
  cycle: number;
  phaseIndex: number;
  elapsed: number;
  completedLocal: boolean;
};

export type BreathingPhaseAdvanceOutcome =
  | { kind: 'noop' }
  | {
      kind: 'advanced';
      state: BreathingTimedLoopState;
      playPhaseCue: boolean;
      playPatternCompleteCue: boolean;
      /** Deep ritual: parent marks header chrome past pattern (brief auto-advances elsewhere). */
      notifyPatternComplete: boolean;
      hapticSuccess: boolean;
    };

/**
 * Maps `computeBreathingPhaseAdvance` to the next timed-loop state and presentation side-effect flags.
 * Audio/haptics stay in `PauseBreathing`; this only encodes when they should fire.
 */
export function resolveBreathingPhaseAdvanceOutcome(input: {
  advance: BreathingPhaseAdvanceResult;
  ritualVariant: 'brief' | 'deep' | undefined;
  current: BreathingTimedLoopState;
}): BreathingPhaseAdvanceOutcome {
  const { advance, ritualVariant, current } = input;
  if (advance.kind === 'tick') return { kind: 'noop' };

  if (advance.kind === 'pattern_complete') {
    return {
      kind: 'advanced',
      state: { ...current, elapsed: 0, completedLocal: true },
      playPhaseCue: false,
      playPatternCompleteCue: true,
      notifyPatternComplete: ritualVariant !== 'brief',
      hapticSuccess: true,
    };
  }

  if (advance.kind === 'next_cycle') {
    return {
      kind: 'advanced',
      state: {
        ...current,
        cycle: advance.nextCycle,
        phaseIndex: 0,
        elapsed: 0,
      },
      playPhaseCue: true,
      playPatternCompleteCue: false,
      notifyPatternComplete: false,
      hapticSuccess: false,
    };
  }

  return {
    kind: 'advanced',
    state: {
      ...current,
      phaseIndex: advance.nextPhaseIndex,
      elapsed: 0,
    },
    playPhaseCue: true,
    playPatternCompleteCue: false,
    notifyPatternComplete: false,
    hapticSuccess: false,
  };
}
