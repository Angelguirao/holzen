import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionDepthPickerHandlers } from '@/hooks/use-pause-session-depth-picker-handlers';

describe('usePauseSessionDepthPickerHandlers', () => {
  it('onBrief selects brief ritual and resets brief step', () => {
    const setRitualEntry = vi.fn();
    const setBriefStep = vi.fn();
    const setPickerAboutOpen = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionDepthPickerHandlers({ setRitualEntry, setBriefStep, setPickerAboutOpen }),
    );
    act(() => {
      result.current.onBrief();
    });
    expect(setRitualEntry).toHaveBeenCalledWith('brief');
    expect(setBriefStep).toHaveBeenCalledWith('feel');
    expect(setPickerAboutOpen).not.toHaveBeenCalled();
  });

  it('onDeep selects deep ritual', () => {
    const setRitualEntry = vi.fn();
    const setBriefStep = vi.fn();
    const setPickerAboutOpen = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionDepthPickerHandlers({ setRitualEntry, setBriefStep, setPickerAboutOpen }),
    );
    act(() => {
      result.current.onDeep();
    });
    expect(setRitualEntry).toHaveBeenCalledWith('deep');
    expect(setBriefStep).not.toHaveBeenCalled();
  });

  it('onAboutPauses opens the sheet', () => {
    const setRitualEntry = vi.fn();
    const setBriefStep = vi.fn();
    const setPickerAboutOpen = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionDepthPickerHandlers({ setRitualEntry, setBriefStep, setPickerAboutOpen }),
    );
    act(() => {
      result.current.onAboutPauses();
    });
    expect(setPickerAboutOpen).toHaveBeenCalledWith(true);
    expect(setRitualEntry).not.toHaveBeenCalled();
  });
});
