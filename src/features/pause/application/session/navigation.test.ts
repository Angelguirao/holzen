import { describe, it, expect } from 'vitest';
import { canAdvanceFromPauseStep } from '@/features/pause/public';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';

const base = {
  breathingFirstCompleted: false,
  breathingSecondCompleted: false,
  moodDone: false,
  frameDone: false,
};

describe('canAdvanceFromPauseStep', () => {
  it('blocks forward from feel until mood (or skip) is committed', () => {
    expect(canAdvanceFromPauseStep({ ...base, step: 'feel' as PauseStep })).toBe(false);
    expect(canAdvanceFromPauseStep({ ...base, step: 'feel' as PauseStep, moodDone: true })).toBe(true);
  });

  it('blocks forward from breathe until the first breathing segment is finished', () => {
    expect(canAdvanceFromPauseStep({ ...base, step: 'breathe' as PauseStep, moodDone: true })).toBe(false);
    expect(
      canAdvanceFromPauseStep({
        ...base,
        step: 'breathe' as PauseStep,
        moodDone: true,
        breathingFirstCompleted: true,
      }),
    ).toBe(true);
  });

  it('always allows forward from reflect', () => {
    expect(
      canAdvanceFromPauseStep({
        ...base,
        step: 'reflect' as PauseStep,
        moodDone: true,
        breathingFirstCompleted: true,
      }),
    ).toBe(true);
  });

  it('blocks forward from frame until the hub is finished', () => {
    expect(
      canAdvanceFromPauseStep({
        ...base,
        step: 'frame' as PauseStep,
        moodDone: true,
        breathingFirstCompleted: true,
      }),
    ).toBe(false);
    expect(
      canAdvanceFromPauseStep({
        ...base,
        step: 'frame' as PauseStep,
        moodDone: true,
        breathingFirstCompleted: true,
        frameDone: true,
      }),
    ).toBe(true);
  });

  it('blocks forward from breath2 until the second breathing segment is finished', () => {
    expect(
      canAdvanceFromPauseStep({
        ...base,
        step: 'breath2' as PauseStep,
        moodDone: true,
        breathingFirstCompleted: true,
        frameDone: true,
      }),
    ).toBe(false);
    expect(
      canAdvanceFromPauseStep({
        ...base,
        step: 'breath2' as PauseStep,
        moodDone: true,
        breathingFirstCompleted: true,
        frameDone: true,
        breathingSecondCompleted: true,
      }),
    ).toBe(true);
  });

  it('never advances past decide via swipe', () => {
    expect(
      canAdvanceFromPauseStep({
        ...base,
        step: 'decide' as PauseStep,
        moodDone: true,
        breathingFirstCompleted: true,
        breathingSecondCompleted: true,
        frameDone: true,
      }),
    ).toBe(false);
  });
});
