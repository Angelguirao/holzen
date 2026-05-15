import { describe, expect, it } from 'vitest';
import {
  BOX_BREATH_PHASE_COUNT,
  computeBreathingPhaseAdvance,
} from '@/lib/pause-breathing-phase-advance';

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
