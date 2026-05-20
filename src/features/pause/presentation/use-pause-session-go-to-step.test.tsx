import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionGoToStep } from './use-pause-session-go-to-step';

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

describe('usePauseSessionGoToStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets forward swipe when advancing along STEPS', () => {
    const setSwipeDirection = vi.fn();
    const setStep = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionGoToStep({
        step: 'feel',
        setSwipeDirection,
        setStep,
      }),
    );
    act(() => {
      result.current.goToStep('breathe');
    });
    expect(setSwipeDirection).toHaveBeenCalledWith('forward');
    expect(setStep).toHaveBeenCalledWith('breathe');
  });

  it('sets back swipe when jumping to an earlier step', () => {
    const setSwipeDirection = vi.fn();
    const setStep = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionGoToStep({
        step: 'decide',
        setSwipeDirection,
        setStep,
      }),
    );
    act(() => {
      result.current.goToStep('feel');
    });
    expect(setSwipeDirection).toHaveBeenCalledWith('back');
    expect(setStep).toHaveBeenCalledWith('feel');
  });
});
