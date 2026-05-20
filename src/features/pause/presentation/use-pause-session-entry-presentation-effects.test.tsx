import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionEntryPresentationEffects } from './use-pause-session-entry-presentation-effects';

describe('usePauseSessionEntryPresentationEffects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('lifts curtain after 100ms on mount', () => {
    const setCurtainLifted = vi.fn();
    renderHook(() =>
      usePauseSessionEntryPresentationEffects({
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
