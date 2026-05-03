import { describe, it, expect } from 'vitest';
import { canAdvanceFromPauseStep } from '@/lib/pause-session-navigation';
import type { PauseStep } from '@/components/pause/PauseProgress';

const base = {
  breathingCompleted: false,
  moodDone: false,
  moodAfterDone: false,
};

describe('canAdvanceFromPauseStep', () => {
  it('blocks forward from breathe until the breathing pattern is finished', () => {
    expect(canAdvanceFromPauseStep({ ...base, step: 'breathe' as PauseStep })).toBe(false);
    expect(
      canAdvanceFromPauseStep({ ...base, step: 'breathe' as PauseStep, breathingCompleted: true }),
    ).toBe(true);
  });

  it('blocks forward from feel until mood (or skip) is committed', () => {
    expect(canAdvanceFromPauseStep({ ...base, step: 'feel' as PauseStep })).toBe(false);
    expect(canAdvanceFromPauseStep({ ...base, step: 'feel' as PauseStep, moodDone: true })).toBe(true);
  });

  it('always allows forward from reflect', () => {
    expect(canAdvanceFromPauseStep({ ...base, step: 'reflect' as PauseStep })).toBe(true);
  });

  it('blocks forward from shift until after-mood (or skip) is committed', () => {
    expect(canAdvanceFromPauseStep({ ...base, step: 'shift' as PauseStep })).toBe(false);
    expect(
      canAdvanceFromPauseStep({ ...base, step: 'shift' as PauseStep, moodAfterDone: true }),
    ).toBe(true);
  });

  it('never advances past decide via swipe', () => {
    expect(
      canAdvanceFromPauseStep({
        ...base,
        step: 'decide' as PauseStep,
        moodAfterDone: true,
        moodDone: true,
        breathingCompleted: true,
      }),
    ).toBe(false);
  });
});
