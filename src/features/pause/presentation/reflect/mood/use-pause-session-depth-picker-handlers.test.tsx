import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  BRIEF_DEPTH_PICKER_RITUAL_ENTRY,
  DEEP_DEPTH_PICKER_RITUAL_ENTRY,
} from '@/features/pause/domain/reflect/mood/pause-session-mood-chrome-flow';
import { usePauseSessionDepthPickerHandlers } from './use-pause-session-depth-picker-handlers';

vi.mock('@/features/pause/public-rpc', () => ({
  BRIEF_DEPTH_PICKER_RITUAL_ENTRY,
  DEEP_DEPTH_PICKER_RITUAL_ENTRY,
}));

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
