import { describe, expect, it } from 'vitest';
import {
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
  resolveBreathingPhaseAdvanceOutcome,
} from '@/features/pause/public';
import {
  BOX_BREATH_PHASE_COUNT,
  BRIEF_TRIANGLE_CYCLE_COUNT,
  TRIANGLE_PHASE_COUNT,
} from '@/features/pause/public';

describe('resolveBreathingCompleted', () => {
  it('uses session-local completion when parent prop is false', () => {
    expect(resolveBreathingCompleted(false, true)).toBe(true);
  });

  it('stays incomplete when both parent and local are false', () => {
    expect(resolveBreathingCompleted(false, false)).toBe(false);
  });

  it('respects parent completion when local is false', () => {
    expect(resolveBreathingCompleted(true, false)).toBe(true);
  });
});

describe('computeBreathingPhaseAdvance', () => {
  const base = {
    phaseCount: BOX_BREATH_PHASE_COUNT,
    totalCycles: 3,
    phaseDuration: 4,
  };

  it('does not advance before phase duration elapses', () => {
    expect(
      computeBreathingPhaseAdvance({
        ...base,
        elapsed: 3,
        phaseIndex: 3,
        cycle: 2,
      }),
    ).toEqual({ kind: 'tick' });
  });

  it('completes pattern on final hold of round 3/3 (phase 3, cycle 2)', () => {
    expect(
      computeBreathingPhaseAdvance({
        ...base,
        elapsed: 4,
        phaseIndex: 3,
        cycle: 2,
      }),
    ).toEqual({ kind: 'pattern_complete' });
  });

  it('advances to next cycle after last phase of a non-final round', () => {
    expect(
      computeBreathingPhaseAdvance({
        ...base,
        elapsed: 4,
        phaseIndex: 3,
        cycle: 0,
      }),
    ).toEqual({ kind: 'next_cycle', nextCycle: 1 });
  });

  it('advances to next phase within a cycle', () => {
    expect(
      computeBreathingPhaseAdvance({
        ...base,
        elapsed: 4,
        phaseIndex: 1,
        cycle: 2,
      }),
    ).toEqual({ kind: 'next_phase', nextPhaseIndex: 2 });
  });
});

describe('resolveBreathingPhaseAdvanceOutcome', () => {
  const current = { cycle: 1, phaseIndex: 2, elapsed: 4, completedLocal: false };

  it('returns noop for tick advances', () => {
    expect(
      resolveBreathingPhaseAdvanceOutcome({
        advance: { kind: 'tick' },
        ritualVariant: 'deep',
        current,
      }),
    ).toEqual({ kind: 'noop' });
  });

  it('marks pattern complete and notifies parent for deep ritual', () => {
    expect(
      resolveBreathingPhaseAdvanceOutcome({
        advance: { kind: 'pattern_complete' },
        ritualVariant: 'deep',
        current,
      }),
    ).toEqual({
      kind: 'advanced',
      state: { ...current, elapsed: 0, completedLocal: true },
      playPhaseCue: false,
      playPatternCompleteCue: true,
      notifyPatternComplete: true,
      hapticSuccess: true,
    });
  });

  it('skips pattern-complete parent notify for brief ritual', () => {
    expect(
      resolveBreathingPhaseAdvanceOutcome({
        advance: { kind: 'pattern_complete' },
        ritualVariant: 'brief',
        current,
      }),
    ).toMatchObject({ kind: 'advanced', notifyPatternComplete: false });
  });

  it('advances cycle and requests phase cue', () => {
    expect(
      resolveBreathingPhaseAdvanceOutcome({
        advance: { kind: 'next_cycle', nextCycle: 2 },
        ritualVariant: 'deep',
        current,
      }),
    ).toEqual({
      kind: 'advanced',
      state: { ...current, cycle: 2, phaseIndex: 0, elapsed: 0 },
      playPhaseCue: true,
      playPatternCompleteCue: false,
      notifyPatternComplete: false,
      hapticSuccess: false,
    });
  });
});

describe('computeBreathingPhaseAdvance (brief ritual)', () => {
  it('completes after final exhale of round 3/3 (no post-exhale hold)', () => {
    expect(
      computeBreathingPhaseAdvance({
        elapsed: 4,
        phaseDuration: 4,
        phaseIndex: 2,
        phaseCount: TRIANGLE_PHASE_COUNT,
        cycle: 2,
        totalCycles: BRIEF_TRIANGLE_CYCLE_COUNT,
      }),
    ).toEqual({ kind: 'pattern_complete' });
  });

  it('advances to next round after exhale on a non-final round', () => {
    expect(
      computeBreathingPhaseAdvance({
        elapsed: 4,
        phaseDuration: 4,
        phaseIndex: 2,
        phaseCount: TRIANGLE_PHASE_COUNT,
        cycle: 0,
        totalCycles: BRIEF_TRIANGLE_CYCLE_COUNT,
      }),
    ).toEqual({ kind: 'next_cycle', nextCycle: 1 });
  });
});
