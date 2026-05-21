import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { showPauseStepSyncFailedToast } from '@/features/pause/application/use-cases/ritual/step-sync-toast';
import {
  runInitialEmotionSelect as runInitialEmotionSelectUseCase,
  runInitialEmotionSkip as runInitialEmotionSkipUseCase,
} from '@/features/pause/application/use-cases/ritual/feel/run-initial-emotion-log';
import { usePauseSessionInitialMoodHandlers } from './use-pause-session-initial-mood-handlers';

const { logStepMock } = vi.hoisted(() => ({
  logStepMock: vi.fn(),
}));

const mockRepository = { logStep: logStepMock } as unknown as PauseRepository;

vi.mock('@/features/pause/public-rpc', () => ({
  runInitialEmotionSelect: (input: Parameters<typeof runInitialEmotionSelectUseCase>[1]) =>
    runInitialEmotionSelectUseCase(mockRepository, input),
  runInitialEmotionSkip: (input: Parameters<typeof runInitialEmotionSkipUseCase>[1]) =>
    runInitialEmotionSkipUseCase(mockRepository, input),
}));

vi.mock('@/features/pause/application/use-cases/ritual/step-sync-toast', () => ({
  showPauseStepSyncFailedToast: vi.fn(),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  logStepMock.mockReset();
  logStepMock.mockResolvedValue(null);
});

function stableMoodSetters() {
  return {
    setMoodDone: vi.fn(),
    setSelectedMood: vi.fn(),
    setFeelIntensity: vi.fn(),
    setSelectedBriefFace: vi.fn(),
  };
}

describe('usePauseSessionInitialMoodHandlers', () => {
  it('dedupes identical mood select so logStep runs once', async () => {
    const lastFeelLogKeyRef: MutableRefObject<string | null> = { current: null };
    const deps = stableMoodSetters();
    const { result } = renderHook(() =>
      usePauseSessionInitialMoodHandlers({
        pauseInstanceId: 'pi-1',
        t,
        lastFeelLogKeyRef,
        ...deps,
      }),
    );
    await act(async () => {
      await result.current.handleMoodSelect('calm', 3);
    });
    expect(logStepMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.handleMoodSelect('calm', 3);
    });
    expect(logStepMock).toHaveBeenCalledTimes(1);
  });

  it('logs skipped initial emotion on skip when instance id present', async () => {
    const lastFeelLogKeyRef: MutableRefObject<string | null> = { current: null };
    const deps = stableMoodSetters();
    const { result } = renderHook(() =>
      usePauseSessionInitialMoodHandlers({
        pauseInstanceId: 'pi-1',
        t,
        lastFeelLogKeyRef,
        ...deps,
      }),
    );
    await act(async () => {
      await result.current.handleMoodSkip();
    });
    expect(logStepMock).toHaveBeenCalledTimes(1);
    expect(logStepMock.mock.calls[0][0].stepType).toBe('initial_emotion_logged');
    expect(deps.setMoodDone).toHaveBeenCalledWith(true);
  });

  it('handleMoodReset clears dedupe ref and mood fields', () => {
    const lastFeelLogKeyRef: MutableRefObject<string | null> = { current: 'x' };
    const deps = stableMoodSetters();
    const { result } = renderHook(() =>
      usePauseSessionInitialMoodHandlers({
        pauseInstanceId: 'pi-1',
        t,
        lastFeelLogKeyRef,
        ...deps,
      }),
    );
    act(() => {
      result.current.handleMoodReset();
    });
    expect(lastFeelLogKeyRef.current).toBeNull();
    expect(deps.setMoodDone).toHaveBeenCalledWith(false);
    expect(deps.setSelectedMood).toHaveBeenCalledWith(null);
    expect(deps.setFeelIntensity).toHaveBeenCalledWith(null);
    expect(deps.setSelectedBriefFace).toHaveBeenCalledWith(null);
  });
});
