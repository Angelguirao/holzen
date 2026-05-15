import { describe, expect, it } from 'vitest';
import {
  BRIEF_TRIANGLE_CYCLE_COUNT,
  holdProgressWithinPhase,
  PAUSE_RITUAL_BREATHING_PATTERN_MODE,
  resolveBreathCycleTotal,
  resolvePauseBreathingPhases,
  rotatingKickerIndexFromElapsed,
  RITUAL_TRIANGLE_KICKER_INTERVAL_SEC,
  secondsIntoTrianglePattern,
  TRIANGLE_PHASE_COUNT,
} from '@/lib/pause-breathing-pattern';

describe('pause-breathing-pattern', () => {
  it('defaults to triangle mode until feel-tile routing ships', () => {
    expect(PAUSE_RITUAL_BREATHING_PATTERN_MODE).toBe('triangle');
  });

  it('resolvePauseBreathingPhases returns three phases (inhale hold exhale)', () => {
    const phases = resolvePauseBreathingPhases({ ritualVariant: 'brief' });
    expect(phases).toHaveLength(TRIANGLE_PHASE_COUNT);
    expect(phases.map((p) => p.labelKey)).toEqual([
      'breathing.phases.inhale',
      'breathing.phases.hold',
      'breathing.phases.exhale',
    ]);
  });

  it('resolveBreathCycleTotal: brief 3 rounds, deep first 3, deep second 2', () => {
    expect(resolveBreathCycleTotal('brief', 'first')).toBe(BRIEF_TRIANGLE_CYCLE_COUNT);
    expect(resolveBreathCycleTotal('deep', 'first')).toBe(3);
    expect(resolveBreathCycleTotal('deep', 'second')).toBe(2);
  });

  it('secondsIntoTrianglePattern sums completed phases within the timed loop', () => {
    const d = [4, 4, 4];
    expect(
      secondsIntoTrianglePattern({
        cycle: 0,
        phaseIndex: 0,
        elapsedInCurrentPhase: 0,
        phaseDurationsSec: d,
      }),
    ).toBe(0);
    expect(
      secondsIntoTrianglePattern({
        cycle: 1,
        phaseIndex: 2,
        elapsedInCurrentPhase: 3,
        phaseDurationsSec: d,
      }),
    ).toBe(12 + 8 + 3);
  });

  it('holdProgressWithinPhase maps discrete seconds to 0→1 within a hold', () => {
    expect(holdProgressWithinPhase(0, 4)).toBe(0);
    expect(holdProgressWithinPhase(1, 4)).toBeCloseTo(1 / 3);
    expect(holdProgressWithinPhase(2, 4)).toBeCloseTo(2 / 3);
    expect(holdProgressWithinPhase(3, 4)).toBe(1);
    expect(holdProgressWithinPhase(0, 1)).toBe(1);
    expect(holdProgressWithinPhase(0, 0)).toBe(0);
  });

  it('rotatingKickerIndexFromElapsed advances every 2s and holds the last line', () => {
    const n = 15;
    expect(rotatingKickerIndexFromElapsed(0, n, RITUAL_TRIANGLE_KICKER_INTERVAL_SEC)).toBe(0);
    expect(rotatingKickerIndexFromElapsed(2, n, RITUAL_TRIANGLE_KICKER_INTERVAL_SEC)).toBe(1);
    expect(rotatingKickerIndexFromElapsed(33, n, RITUAL_TRIANGLE_KICKER_INTERVAL_SEC)).toBe(14);
    expect(rotatingKickerIndexFromElapsed(40, n, RITUAL_TRIANGLE_KICKER_INTERVAL_SEC)).toBe(14);
  });
});
