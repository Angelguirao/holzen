import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import { usePauseSessionHeaderBackHandler } from '@/hooks/use-pause-session-header-back-handler';
import type { PauseBreathingHandle } from '@/components/pause/PauseBreathing';

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

  it('resets breath intro on brief breath when timer active', () => {
    const input = baseInput({
      briefStep: 'breath',
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
  });

  it('clears first breath completed on brief breath after first segment done', () => {
    const input = baseInput({
      briefStep: 'breath',
      breathingFirstCompleted: true,
      breathTimedActive: false,
    });
    const { result } = renderHook(() => usePauseSessionHeaderBackHandler(input));
    act(() => {
      result.current.handlePauseHeaderBack();
    });
    expect(input.setBreathingFirstCompleted).toHaveBeenCalledWith(false);
    expect(input.goBack).not.toHaveBeenCalled();
  });
});
