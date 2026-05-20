import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { showPauseStepSyncFailedToast } from '@/features/pause/application/use-cases/feedback/step-sync-toast';
import { runShiftEmotionFrameHubDone as runShiftEmotionFrameHubDoneUseCase } from '@/features/pause/application/use-cases/ritual/feel/shift-emotion-log';
import { usePauseShiftFrameDoneHandler } from './use-pause-shift-frame-done-handler';

const { logStepMock } = vi.hoisted(() => ({
  logStepMock: vi.fn(),
}));

const mockRepository = { logStep: logStepMock } as unknown as PauseRepository;

vi.mock('@/features/pause/public-rpc', () => ({
  runShiftEmotionFrameHubDone: (input: Parameters<typeof runShiftEmotionFrameHubDoneUseCase>[1]) =>
    runShiftEmotionFrameHubDoneUseCase(mockRepository, input),
}));

vi.mock('@/features/pause/application/use-cases/feedback/step-sync-toast', () => ({
  showPauseStepSyncFailedToast: vi.fn(),
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  logStepMock.mockReset();
  logStepMock.mockResolvedValue(null);
  vi.mocked(showPauseStepSyncFailedToast).mockClear();
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
    expect(logStepMock).toHaveBeenCalledTimes(1);
    expect(logStepMock.mock.calls[0][0].stepType).toBe('shift_emotion_logged');
    await act(async () => {
      await result.current.handleFrameImDone();
    });
    expect(logStepMock).toHaveBeenCalledTimes(1);
    expect(goToStep).toHaveBeenLastCalledWith('breath2');
    expect(setFrameDone).toHaveBeenCalled();
    expect(setMoodAfterDone).toHaveBeenCalled();
  });

  it('does not advance when RPC fails', async () => {
    logStepMock.mockRejectedValueOnce(new Error('network'));
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
    expect(logStepMock).not.toHaveBeenCalled();
    expect(goToStep).toHaveBeenCalledWith('breath2');
  });
});
