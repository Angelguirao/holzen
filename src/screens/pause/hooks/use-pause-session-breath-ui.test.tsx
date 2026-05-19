import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionBreathUi } from '@/screens/pause/hooks/use-pause-session-breath-ui';

function baseInput(overrides: Partial<Parameters<typeof usePauseSessionBreathUi>[0]> = {}) {
  return {
    ritualEntry: 'deep' as const,
    briefStep: 'feel' as const,
    step: 'breathe' as const,
    setSwipeDirection: vi.fn(),
    setBriefIntegrateDone: vi.fn(),
    setBriefStep: vi.fn(),
    setBreathingFirstCompleted: vi.fn(),
    setBreathingSecondCompleted: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePauseSessionBreathUi', () => {
  it('trackBreathTimedActive marks first pattern started on deep breathe', () => {
    const { result } = renderHook(() => usePauseSessionBreathUi(baseInput()));
    act(() => {
      result.current.trackBreathTimedActive(true);
    });
    expect(result.current.breathTimedActive).toBe(true);
    expect(result.current.breathFirstTimedPatternStarted).toBe(true);
    expect(result.current.breathSecondTimedPatternStarted).toBe(false);
  });

  it('handleDeepFirstBreathRepeat resets completion and timed flags', () => {
    const setBreathingFirstCompleted = vi.fn();
    const setSwipeDirection = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionBreathUi(baseInput({ setBreathingFirstCompleted, setSwipeDirection })),
    );
    act(() => {
      result.current.trackBreathTimedActive(true);
    });
    act(() => {
      result.current.handleDeepFirstBreathRepeat();
    });
    expect(setSwipeDirection).toHaveBeenCalledWith('back');
    expect(setBreathingFirstCompleted).toHaveBeenCalledWith(false);
    expect(result.current.breathTimedActive).toBe(false);
    expect(result.current.breathFirstTimedPatternStarted).toBe(false);
  });
});
