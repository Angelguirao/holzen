import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { runShiftEmotionFrameHubDone } from '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done';
import { usePauseShiftFrameDoneHandler } from './use-pause-shift-frame-done-handler';

const {
  logStepMock,
  mockRepository,
  showPauseStepSyncFailedToast,
  logPauseShiftEmotionFrameHubDone,
} = vi.hoisted(() => {
  const logStepMock = vi.fn();
  const mockRepository = { logStep: logStepMock } as unknown as PauseRepository;
  return {
    logStepMock,
    mockRepository,
    showPauseStepSyncFailedToast: vi.fn(),
    logPauseShiftEmotionFrameHubDone: vi.fn((input: Parameters<typeof runShiftEmotionFrameHubDone>[1]) =>
      runShiftEmotionFrameHubDone(mockRepository, input),
    ),
  };
});

vi.mock('@/features/pause/public-rpc', () => ({
  logPauseShiftEmotionFrameHubDone,
  showPauseStepSyncFailedToast,
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
    await act(async () => {
      await result.current.handleFrameImDone();
    });
    expect(logStepMock).toHaveBeenCalledTimes(1);
    expect(goToStep).toHaveBeenLastCalledWith('breath2');
    expect(setFrameDone).toHaveBeenCalled();
    expect(setMoodAfterDone).toHaveBeenCalled();
  });

  it('does not advance when RPC fails', async () => {
    logStepMock.mockRejectedValueOnce(new Error('rpc'));
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
    expect(showPauseStepSyncFailedToast).toHaveBeenCalledWith(t);
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
