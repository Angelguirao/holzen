import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionBriefPastStep } from '@/screens/pause/hooks/use-pause-session-brief-past-step';

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

describe('usePauseSessionBriefPastStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when tap is not allowed', () => {
    const setBriefStep = vi.fn();
    const setBriefIntegrateDone = vi.fn();
    const setSwipeDirection = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionBriefPastStep({
        briefStep: 'feel',
        setBriefStep,
        setBriefIntegrateDone,
        setSwipeDirection,
      }),
    );
    act(() => {
      result.current.goToBriefPastStep('feel');
    });
    expect(setSwipeDirection).not.toHaveBeenCalled();
    expect(setBriefStep).not.toHaveBeenCalled();
    expect(setBriefIntegrateDone).not.toHaveBeenCalled();
  });

  it('navigates back and clears integrate when landing on feel from breath', () => {
    const setBriefStep = vi.fn();
    const setBriefIntegrateDone = vi.fn();
    const setSwipeDirection = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionBriefPastStep({
        briefStep: 'breath',
        setBriefStep,
        setBriefIntegrateDone,
        setSwipeDirection,
      }),
    );
    act(() => {
      result.current.goToBriefPastStep('feel');
    });
    expect(setSwipeDirection).toHaveBeenCalledWith('back');
    expect(setBriefStep).toHaveBeenCalledWith('feel');
    expect(setBriefIntegrateDone).toHaveBeenCalledWith(false);
  });

  it('does not clear integrate when jumping to integrate from decide', () => {
    const setBriefStep = vi.fn();
    const setBriefIntegrateDone = vi.fn();
    const setSwipeDirection = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionBriefPastStep({
        briefStep: 'decide',
        setBriefStep,
        setBriefIntegrateDone,
        setSwipeDirection,
      }),
    );
    act(() => {
      result.current.goToBriefPastStep('integrate');
    });
    expect(setBriefStep).toHaveBeenCalledWith('integrate');
    expect(setBriefIntegrateDone).not.toHaveBeenCalled();
  });
});
