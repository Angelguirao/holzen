import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionDeepChooseBridgeHandler } from '@/hooks/use-pause-session-deep-choose-bridge-handler';

describe('usePauseSessionDeepChooseBridgeHandler', () => {
  it('sets decide back target to choose then navigates to decide', () => {
    const setDecideOnBackStep = vi.fn();
    const goToStep = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionDeepChooseBridgeHandler({ setDecideOnBackStep, goToStep }),
    );
    act(() => {
      result.current.handleDeepChooseBridgeContinue();
    });
    expect(setDecideOnBackStep).toHaveBeenCalledWith('choose');
    expect(goToStep).toHaveBeenCalledWith('decide');
  });
});
