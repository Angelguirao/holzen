import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionDepthPickerHandlers } from './use-pause-session-depth-picker-handlers';

vi.mock('./pause-reflect-mood-io', async () => {
  const depthPicker = await vi.importActual<
    typeof import('@/features/pause/application/use-cases/ritual/reflect/mood/pause-depth-picker-mood-flow')
  >('@/features/pause/application/use-cases/ritual/reflect/mood/pause-depth-picker-mood-flow');
  return depthPicker;
});

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
