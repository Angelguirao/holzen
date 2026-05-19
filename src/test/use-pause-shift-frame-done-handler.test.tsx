import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import { usePauseShiftFrameDoneHandler } from '@/screens/pause/hooks/use-pause-shift-frame-done-handler';

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

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  pauseLogStepMock.mockReset();
  pauseLogStepMock.mockResolvedValue(undefined);
});

describe('usePauseShiftFrameDoneHandler', () => {
  it('logs shift_emotion_logged once when logKey unchanged on second Im done', async () => {
    const lastShiftLogKeyRef: MutableRefObject<string | null> = { current: null };
    const setFrameDone = vi.fn();
    const setMoodAfterDone = vi.fn();
    const goToStep = vi.fn();
    const { result } = renderHook(() =>
      usePauseShiftFrameDoneHandler({
        pauseInstanceId: 'pi-1',
        t,
        lastShiftLogKeyRef,
        setFrameDone,
        setMoodAfterDone,
        goToStep,
      }),
    );
    await act(async () => {
      await result.current.handleFrameImDone();
    });
    expect(pauseLogStepMock).toHaveBeenCalledTimes(1);
    expect(pauseLogStepMock.mock.calls[0][0].stepType).toBe('shift_emotion_logged');
    await act(async () => {
      await result.current.handleFrameImDone();
    });
    expect(pauseLogStepMock).toHaveBeenCalledTimes(1);
    expect(goToStep).toHaveBeenLastCalledWith('breath2');
    expect(setFrameDone).toHaveBeenCalled();
    expect(setMoodAfterDone).toHaveBeenCalled();
  });

  it('does not advance when RPC fails', async () => {
    pauseLogStepMock.mockRejectedValueOnce(new Error('network'));
    const lastShiftLogKeyRef: MutableRefObject<string | null> = { current: null };
    const setFrameDone = vi.fn();
    const setMoodAfterDone = vi.fn();
    const goToStep = vi.fn();
    const { result } = renderHook(() =>
      usePauseShiftFrameDoneHandler({
        pauseInstanceId: 'pi-1',
        t,
        lastShiftLogKeyRef,
        setFrameDone,
        setMoodAfterDone,
        goToStep,
      }),
    );
    await act(async () => {
      await result.current.handleFrameImDone();
    });
    expect(setFrameDone).not.toHaveBeenCalled();
    expect(goToStep).not.toHaveBeenCalled();
  });

  it('advances without RPC when no pause instance id', async () => {
    const lastShiftLogKeyRef: MutableRefObject<string | null> = { current: null };
    const setFrameDone = vi.fn();
    const setMoodAfterDone = vi.fn();
    const goToStep = vi.fn();
    const { result } = renderHook(() =>
      usePauseShiftFrameDoneHandler({
        pauseInstanceId: null,
        t,
        lastShiftLogKeyRef,
        setFrameDone,
        setMoodAfterDone,
        goToStep,
      }),
    );
    await act(async () => {
      await result.current.handleFrameImDone();
    });
    expect(pauseLogStepMock).not.toHaveBeenCalled();
    expect(goToStep).toHaveBeenCalledWith('breath2');
  });
});
