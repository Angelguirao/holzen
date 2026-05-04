import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionEntryPresentationEffects } from '@/hooks/use-pause-session-entry-presentation-effects';

describe('usePauseSessionEntryPresentationEffects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets decide back target to choose when step is breath2', () => {
    const setDecideOnBackStep = vi.fn();
    const setCurtainLifted = vi.fn();
    const { rerender } = renderHook(
      ({ step }: { step: 'feel' | 'breath2' }) =>
        usePauseSessionEntryPresentationEffects({
          step,
          setDecideOnBackStep,
          setCurtainLifted,
        }),
      { initialProps: { step: 'feel' as const } },
    );
    expect(setDecideOnBackStep).not.toHaveBeenCalled();
    rerender({ step: 'breath2' });
    expect(setDecideOnBackStep).toHaveBeenCalledWith('choose');
  });

  it('lifts curtain after 100ms on mount', () => {
    const setDecideOnBackStep = vi.fn();
    const setCurtainLifted = vi.fn();
    renderHook(() =>
      usePauseSessionEntryPresentationEffects({
        step: 'feel',
        setDecideOnBackStep,
        setCurtainLifted,
      }),
    );
    expect(setCurtainLifted).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(setCurtainLifted).toHaveBeenCalledWith(true);
  });
});
