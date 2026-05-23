import { describe, expect, it } from 'vitest';
import { resolveTriangleKickerDisplay } from './resolve-triangle-kicker-display';

describe('resolveTriangleKickerDisplay', () => {
  const phaseDurationsSec = [4, 4, 4] as const;

  it('returns empty when no kickers', () => {
    expect(
      resolveTriangleKickerDisplay({
        kickers: [],
        cycle: 0,
        phaseIndex: 0,
        elapsedInCurrentPhase: 0,
        phaseDurationsSec,
      }),
    ).toEqual({ line: '', index: 0, hasKickers: false });
  });

  it('picks first kicker at start of pattern', () => {
    const result = resolveTriangleKickerDisplay({
      kickers: ['a', 'b', 'c'],
      cycle: 0,
      phaseIndex: 0,
      elapsedInCurrentPhase: 0,
      phaseDurationsSec,
    });
    expect(result.hasKickers).toBe(true);
    expect(result.line).toBe('a');
    expect(result.index).toBe(0);
  });

  it('advances kicker index as seconds into pattern increase', () => {
    const early = resolveTriangleKickerDisplay({
      kickers: ['a', 'b', 'c'],
      cycle: 0,
      phaseIndex: 0,
      elapsedInCurrentPhase: 0,
      phaseDurationsSec,
    });
    const later = resolveTriangleKickerDisplay({
      kickers: ['a', 'b', 'c'],
      cycle: 0,
      phaseIndex: 0,
      elapsedInCurrentPhase: 3,
      phaseDurationsSec,
    });
    expect(later.index).toBeGreaterThanOrEqual(early.index);
  });
});
