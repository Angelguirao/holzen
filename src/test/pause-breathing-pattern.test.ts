import { describe, expect, it } from 'vitest';
import {
  BRIEF_TRIANGLE_CYCLE_COUNT,
  PAUSE_RITUAL_BREATHING_PATTERN_MODE,
  resolveBreathCycleTotal,
  resolvePauseBreathingPhases,
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
});
