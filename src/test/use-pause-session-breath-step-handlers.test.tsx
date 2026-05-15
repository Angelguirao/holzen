import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionBreathStepHandlers } from '@/hooks/use-pause-session-breath-step-handlers';

function baseInput(overrides: Partial<Parameters<typeof usePauseSessionBreathStepHandlers>[0]> = {}) {
  return {
    goToStep: vi.fn(),
    ritualEntry: 'deep' as const,
    briefStep: 'feel' as const,
    ensureBreathSegment1Logged: vi.fn().mockResolvedValue(true),
    ensureBreathSegment2Logged: vi.fn().mockResolvedValue(true),
    logBreathSegment1Skipped: vi.fn().mockResolvedValue(true),
    logBreathSegment2Skipped: vi.fn().mockResolvedValue(true),
    setBreathingFirstCompleted: vi.fn(),
    setBreathingSecondCompleted: vi.fn(),
    setBriefStep: vi.fn(),
    setBriefIntegrateDone: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePauseSessionBreathStepHandlers', () => {
  it('handleContinueAfterFirstBreath does not advance when segment 1 log fails', async () => {
    const input = baseInput({
      ensureBreathSegment1Logged: vi.fn().mockResolvedValue(false),
    });
    const { result } = renderHook(() => usePauseSessionBreathStepHandlers(input));
    await act(async () => {
      await result.current.handleContinueAfterFirstBreath();
    });
    expect(input.goToStep).not.toHaveBeenCalled();
  });

  it('handleContinueAfterFirstBreath goes to reflect when segment 1 succeeds', async () => {
    const input = baseInput();
    const { result } = renderHook(() => usePauseSessionBreathStepHandlers(input));
    await act(async () => {
      await result.current.handleContinueAfterFirstBreath();
    });
    expect(input.ensureBreathSegment1Logged).toHaveBeenCalledWith();
    expect(input.goToStep).toHaveBeenCalledWith('reflect');
  });

  it('handleBriefBreathContinue sets first segment completed after RPC then moves to integrate', async () => {
    const setBreathingFirstCompleted = vi.fn();
    const input = baseInput({
      ritualEntry: 'brief',
      briefStep: 'breath',
      setBreathingFirstCompleted,
    });
    const { result } = renderHook(() => usePauseSessionBreathStepHandlers(input));
    await act(async () => {
      await result.current.handleBriefBreathContinue();
    });
    expect(input.ensureBreathSegment1Logged).toHaveBeenCalledWith(true);
    expect(setBreathingFirstCompleted).toHaveBeenCalledWith(true);
    expect(input.setBriefStep).toHaveBeenCalledWith('integrate');
  });

  it('handleContinueAfterSecondBreath goes to decide when segment 2 succeeds', async () => {
    const input = baseInput();
    const { result } = renderHook(() => usePauseSessionBreathStepHandlers(input));
    await act(async () => {
      await result.current.handleContinueAfterSecondBreath();
    });
    expect(input.ensureBreathSegment2Logged).toHaveBeenCalled();
    expect(input.goToStep).toHaveBeenCalledWith('decide');
  });

  it('handleSkipSecondBreath goes to decide when skip RPC succeeds', async () => {
    const input = baseInput();
    const { result } = renderHook(() => usePauseSessionBreathStepHandlers(input));
    await act(async () => {
      await result.current.handleSkipSecondBreath();
    });
    expect(input.goToStep).toHaveBeenCalledWith('decide');
  });

  it('handleBriefIntegrateComplete only advances once', () => {
    const input = baseInput({ ritualEntry: 'brief', briefStep: 'integrate' });
    const { result } = renderHook(() => usePauseSessionBreathStepHandlers(input));
    act(() => {
      result.current.handleBriefIntegrateComplete();
      result.current.handleBriefIntegrateComplete();
    });
    expect(input.setBriefStep).toHaveBeenCalledTimes(1);
    expect(input.setBriefStep).toHaveBeenCalledWith('decide');
    expect(input.setBriefIntegrateDone).toHaveBeenCalledTimes(1);
  });
});
