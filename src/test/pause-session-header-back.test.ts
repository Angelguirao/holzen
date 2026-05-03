import { describe, expect, it } from 'vitest';
import { isPauseSessionHeaderBackVisible } from '@/lib/pause-session-header-back';
import type { PauseSessionHeaderBackInput } from '@/lib/pause-session-header-back';

const base = (over: Partial<PauseSessionHeaderBackInput> = {}): PauseSessionHeaderBackInput => ({
  phase: 'session',
  ritualEntry: 'deep',
  briefStep: 'feel',
  step: 'feel',
  breathTimedActive: false,
  breathingFirstCompleted: false,
  breathingSecondCompleted: false,
  ...over,
});

describe('isPauseSessionHeaderBackVisible', () => {
  it('is false when not in session phase', () => {
    expect(isPauseSessionHeaderBackVisible(base({ phase: 'done' }))).toBe(false);
  });

  it('brief: false on first macro step with no breath escape hatches', () => {
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'brief', briefStep: 'feel', step: 'feel' }),
      ),
    ).toBe(false);
  });

  it('brief: true when past first step', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'brief', briefStep: 'breath' }))).toBe(true);
  });

  it('brief: true on breath when timed segment active', () => {
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'brief', briefStep: 'feel', breathTimedActive: true }),
      ),
    ).toBe(false);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'brief', briefStep: 'breath', breathTimedActive: true }),
      ),
    ).toBe(true);
  });

  it('brief: true on breath when first breath already completed', () => {
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'brief', briefStep: 'breath', breathingFirstCompleted: true }),
      ),
    ).toBe(true);
  });

  it('deep: false on feel with no breath state', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'feel' }))).toBe(false);
  });

  it('deep: true when past first STEPS entry', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'breathe' }))).toBe(true);
  });

  it('deep: true on breath2 when second segment completed', () => {
    expect(
      isPauseSessionHeaderBackVisible(
        base({
          ritualEntry: 'deep',
          step: 'breath2',
          breathingSecondCompleted: true,
        }),
      ),
    ).toBe(true);
  });

  it('picker uses non-brief branch', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'picker', step: 'feel' }))).toBe(false);
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'picker', step: 'breathe' }))).toBe(true);
  });
});
