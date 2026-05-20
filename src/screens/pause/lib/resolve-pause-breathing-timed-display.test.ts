import { describe, expect, it } from 'vitest';
import { resolvePauseBreathingTimedDisplay } from '@/screens/pause/lib/resolve-pause-breathing-timed-display';

const phases = [
  { labelKey: 'breathing.phases.inhale', duration: 4 },
  { labelKey: 'breathing.phases.hold', duration: 2 },
  { labelKey: 'breathing.phases.exhale', duration: 4 },
] as const;

describe('resolvePauseBreathingTimedDisplay', () => {
  it('returns empty kicker line when kickers list is empty', () => {
    const out = resolvePauseBreathingTimedDisplay({
      phases,
      currentPhase: phases[0],
      elapsed: 1,
      cycle: 0,
      phaseIndex: 0,
      triangleRotatingKickers: [],
    });
    expect(out.hasTriangleKickers).toBe(false);
    expect(out.triangleKickerLine).toBe('');
    expect(out.orbScale).toBeGreaterThan(0);
  });

  it('picks first kicker at pattern start', () => {
    const out = resolvePauseBreathingTimedDisplay({
      phases,
      currentPhase: phases[0],
      elapsed: 0,
      cycle: 0,
      phaseIndex: 0,
      triangleRotatingKickers: ['one', 'two'],
    });
    expect(out.hasTriangleKickers).toBe(true);
    expect(out.triangleKickerLine).toBe('one');
    expect(out.triangleKickerIndex).toBe(0);
  });
});
