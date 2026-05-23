import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePauseSessionBreathTimedActiveReset } from './use-pause-session-breath-timed-active-reset';

describe('usePauseSessionBreathTimedActiveReset', () => {
  it('clears timed active when brief ritual leaves breath macro', () => {
    const setBreathTimedActive = vi.fn();
    const { rerender } = renderHook(
      ({ briefStep }: { briefStep: 'breath' | 'feel' }) =>
        usePauseSessionBreathTimedActiveReset({
          step: 'breathe',
          ritualEntry: 'brief',
          briefStep,
          setBreathTimedActive,
        }),
      { initialProps: { briefStep: 'breath' as const } },
    );
    setBreathTimedActive.mockClear();
    rerender({ briefStep: 'feel' });
    expect(setBreathTimedActive).toHaveBeenCalledWith(false);
  });

  it('does not clear on brief breath macro', () => {
    const setBreathTimedActive = vi.fn();
    renderHook(() =>
      usePauseSessionBreathTimedActiveReset({
        step: 'breathe',
        ritualEntry: 'brief',
        briefStep: 'breath',
        setBreathTimedActive,
      }),
    );
    expect(setBreathTimedActive).not.toHaveBeenCalled();
  });

  it('clears timed active on deep ritual when step is not a breath step', () => {
    const setBreathTimedActive = vi.fn();
    renderHook(() =>
      usePauseSessionBreathTimedActiveReset({
        step: 'reflect',
        ritualEntry: 'deep',
        briefStep: 'feel',
        setBreathTimedActive,
      }),
    );
    expect(setBreathTimedActive).toHaveBeenCalledWith(false);
  });

  it('does not clear on deep when step is breathe', () => {
    const setBreathTimedActive = vi.fn();
    renderHook(() =>
      usePauseSessionBreathTimedActiveReset({
        step: 'breathe',
        ritualEntry: 'deep',
        briefStep: 'feel',
        setBreathTimedActive,
      }),
    );
    expect(setBreathTimedActive).not.toHaveBeenCalled();
  });
});
