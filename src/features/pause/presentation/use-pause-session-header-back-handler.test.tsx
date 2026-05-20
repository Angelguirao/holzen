import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import type { PauseBreathingHandle } from '@/features/pause/presentation/session/pause-breathing-handle';
import { usePauseSessionHeaderBackHandler } from './use-pause-session-header-back-handler';

function baseInput(
  overrides: Partial<Parameters<typeof usePauseSessionHeaderBackHandler>[0]> = {},
): Parameters<typeof usePauseSessionHeaderBackHandler>[0] {
  const resetToIntro = vi.fn();
  const breathingRef: MutableRefObject<PauseBreathingHandle | null> = {
    current: { resetToIntro } as unknown as PauseBreathingHandle,
  };
  return {
    breathingRef,
    ritualEntry: 'brief',
    briefStep: 'feel',
    step: 'feel',
    breathTimedActive: false,
    breathingFirstCompleted: false,
    breathingSecondCompleted: false,
    goBack: vi.fn(),
    setBreathingFirstCompleted: vi.fn(),
    setBreathingSecondCompleted: vi.fn(),
    setBreathSecondTimedPatternStarted: vi.fn(),
    ...overrides,
  };
}

describe('usePauseSessionHeaderBackHandler', () => {
  it('calls goBack for brief non-breath macro step', () => {
    const input = baseInput();
    const { result } = renderHook(() => usePauseSessionHeaderBackHandler(input));
    act(() => {
      result.current.handlePauseHeaderBack();
    });
    expect(input.goBack).toHaveBeenCalledTimes(1);
    const reset = (input.breathingRef.current as unknown as { resetToIntro: ReturnType<typeof vi.fn> })
      .resetToIntro;
    expect(reset).not.toHaveBeenCalled();
  });

  it('calls goBack on brief Breathe (including during timed pattern)', () => {
    const input = baseInput({
      briefStep: 'breath',
      breathTimedActive: true,
    });
    const { result } = renderHook(() => usePauseSessionHeaderBackHandler(input));
    act(() => {
      result.current.handlePauseHeaderBack();
    });
    expect(input.goBack).toHaveBeenCalledTimes(1);
    const reset = (input.breathingRef.current as unknown as { resetToIntro: ReturnType<typeof vi.fn> })
      .resetToIntro;
    expect(reset).not.toHaveBeenCalled();
  });

  it('calls goBack on brief Breathe after pattern complete (to Feel)', () => {
    const input = baseInput({
      briefStep: 'breath',
      breathingFirstCompleted: true,
      breathTimedActive: false,
    });
    const { result } = renderHook(() => usePauseSessionHeaderBackHandler(input));
    act(() => {
      result.current.handlePauseHeaderBack();
    });
    expect(input.goBack).toHaveBeenCalledTimes(1);
    expect(input.setBreathingFirstCompleted).not.toHaveBeenCalled();
  });

  it('deep first Breathe: clears first-segment flag then goBack (to Feel)', () => {
    const input = baseInput({
      ritualEntry: 'deep',
      briefStep: 'feel',
      step: 'breathe',
      breathTimedActive: true,
      breathingFirstCompleted: true,
    });
    const { result } = renderHook(() => usePauseSessionHeaderBackHandler(input));
    act(() => {
      result.current.handlePauseHeaderBack();
    });
    expect(input.setBreathingFirstCompleted).toHaveBeenCalledWith(false);
    expect(input.goBack).toHaveBeenCalledTimes(1);
    const reset = (input.breathingRef.current as unknown as { resetToIntro: ReturnType<typeof vi.fn> })
      .resetToIntro;
    expect(reset).not.toHaveBeenCalled();
  });

  it('deep second Breathe while timed: resetToIntro and clears second timed flag', () => {
    const input = baseInput({
      ritualEntry: 'deep',
      briefStep: 'feel',
      step: 'breath2',
      breathTimedActive: true,
    });
    const { result } = renderHook(() => usePauseSessionHeaderBackHandler(input));
    act(() => {
      result.current.handlePauseHeaderBack();
    });
    expect(input.goBack).not.toHaveBeenCalled();
    const reset = (input.breathingRef.current as unknown as { resetToIntro: ReturnType<typeof vi.fn> })
      .resetToIntro;
    expect(reset).toHaveBeenCalledTimes(1);
    expect(input.setBreathSecondTimedPatternStarted).toHaveBeenCalledWith(false);
  });

  it('deep second Breathe interstitial: reset clears second completion and timed flag', () => {
    const input = baseInput({
      ritualEntry: 'deep',
      briefStep: 'feel',
      step: 'breath2',
      breathTimedActive: false,
      breathingSecondCompleted: true,
    });
    const { result } = renderHook(() => usePauseSessionHeaderBackHandler(input));
    act(() => {
      result.current.handlePauseHeaderBack();
    });
    expect(input.setBreathingSecondCompleted).toHaveBeenCalledWith(false);
    expect(input.setBreathSecondTimedPatternStarted).toHaveBeenCalledWith(false);
    const reset = (input.breathingRef.current as unknown as { resetToIntro: ReturnType<typeof vi.fn> })
      .resetToIntro;
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
