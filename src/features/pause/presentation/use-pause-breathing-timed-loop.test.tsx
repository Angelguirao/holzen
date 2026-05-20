import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePauseBreathingTimedLoop } from './use-pause-breathing-timed-loop';

vi.mock('@/features/pause/public', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/pause/public')>();
  return {
    ...actual,
    playPauseBreathPhaseCue: vi.fn(),
    playPauseBreathPatternCompleteCue: vi.fn(),
  };
});

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

const phases = [
  { duration: 2, labelKey: 'breathing.phases.inhale' },
  { duration: 2, labelKey: 'breathing.phases.hold' },
  { duration: 2, labelKey: 'breathing.phases.exhale' },
] as const;

describe('usePauseBreathingTimedLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('increments elapsed each second while started', () => {
    const { result } = renderHook(() =>
      usePauseBreathingTimedLoop({
        phases,
        totalCycles: 1,
        ritualSoundMuted: true,
        prefersReduced: true,
      }),
    );

    act(() => result.current.setStarted(true));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.elapsed).toBe(1);
  });

  it('resetToIntro clears timed-loop state', () => {
    const { result } = renderHook(() =>
      usePauseBreathingTimedLoop({
        phases,
        totalCycles: 1,
        ritualSoundMuted: true,
        prefersReduced: true,
      }),
    );

    act(() => {
      result.current.setStarted(true);
      result.current.setCompletedLocal(true);
      result.current.resetToIntro();
    });

    expect(result.current.started).toBe(false);
    expect(result.current.completedLocal).toBe(false);
    expect(result.current.elapsed).toBe(0);
    expect(result.current.cycle).toBe(0);
    expect(result.current.phaseIndex).toBe(0);
  });
});
