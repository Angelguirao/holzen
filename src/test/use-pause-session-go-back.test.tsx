import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionGoBack } from '@/hooks/use-pause-session-go-back';

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

function makeSetters() {
  return {
    setSwipeDirection: vi.fn(),
    setBriefStep: vi.fn(),
    setBriefIntegrateDone: vi.fn(),
    setStep: vi.fn(),
  };
}

describe('usePauseSessionGoBack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when plan is none (brief first macro)', () => {
    const s = makeSetters();
    const { result } = renderHook(() =>
      usePauseSessionGoBack({
        ritualEntry: 'brief',
        briefStep: 'feel',
        step: 'feel',
        ...s,
      }),
    );
    act(() => {
      result.current.goBack();
    });
    expect(s.setSwipeDirection).not.toHaveBeenCalled();
    expect(s.setBriefStep).not.toHaveBeenCalled();
    expect(s.setStep).not.toHaveBeenCalled();
  });

  it('brief: goes to previous macro and may clear integrate', () => {
    const s = makeSetters();
    const { result } = renderHook(() =>
      usePauseSessionGoBack({
        ritualEntry: 'brief',
        briefStep: 'integrate',
        step: 'feel',
        ...s,
      }),
    );
    act(() => {
      result.current.goBack();
    });
    expect(s.setSwipeDirection).toHaveBeenCalledWith('back');
    expect(s.setBriefStep).toHaveBeenCalledWith('breath');
    expect(s.setBriefIntegrateDone).toHaveBeenCalledWith(false);
    expect(s.setStep).not.toHaveBeenCalled();
  });

  it('deep: updates pause step only', () => {
    const s = makeSetters();
    const { result } = renderHook(() =>
      usePauseSessionGoBack({
        ritualEntry: 'picker',
        briefStep: 'feel',
        step: 'breathe',
        ...s,
      }),
    );
    act(() => {
      result.current.goBack();
    });
    expect(s.setSwipeDirection).toHaveBeenCalledWith('back');
    expect(s.setStep).toHaveBeenCalledWith('feel');
    expect(s.setBriefStep).not.toHaveBeenCalled();
  });
});
