import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import { usePauseSessionInitialMoodHandlers } from '@/screens/pause/hooks/use-pause-session-initial-mood-handlers';

const { pauseLogStepMock } = vi.hoisted(() => ({
  pauseLogStepMock: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  pauseLogStep: (...args: unknown[]) => pauseLogStepMock(...args),
}));

vi.mock('@/features/pause/public', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/pause/public')>();
  return {
    ...actual,
    showPauseStepSyncFailedToast: vi.fn(),
  };
});

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  pauseLogStepMock.mockReset();
  pauseLogStepMock.mockResolvedValue(undefined);
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
  it('dedupes identical mood select so pauseLogStep runs once', async () => {
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
    expect(pauseLogStepMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.handleMoodSelect('calm', 3);
    });
    expect(pauseLogStepMock).toHaveBeenCalledTimes(1);
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
    expect(pauseLogStepMock).toHaveBeenCalledTimes(1);
    expect(pauseLogStepMock.mock.calls[0][0].stepType).toBe('initial_emotion_logged');
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
