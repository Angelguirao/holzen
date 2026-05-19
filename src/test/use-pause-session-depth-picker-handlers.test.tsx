import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionDepthPickerHandlers } from '@/screens/pause/hooks/use-pause-session-depth-picker-handlers';

describe('usePauseSessionDepthPickerHandlers', () => {
  it('onBrief selects brief ritual and resets brief step', () => {
    const setRitualEntry = vi.fn();
    const setBriefStep = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionDepthPickerHandlers({ setRitualEntry, setBriefStep }),
    );
    act(() => {
      result.current.onBrief();
    });
    expect(setRitualEntry).toHaveBeenCalledWith('brief');
    expect(setBriefStep).toHaveBeenCalledWith('feel');
  });

  it('onDeep selects deep ritual', () => {
    const setRitualEntry = vi.fn();
    const setBriefStep = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionDepthPickerHandlers({ setRitualEntry, setBriefStep }),
    );
    act(() => {
      result.current.onDeep();
    });
    expect(setRitualEntry).toHaveBeenCalledWith('deep');
    expect(setBriefStep).not.toHaveBeenCalled();
  });
});
