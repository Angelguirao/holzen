import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import { usePauseShiftFrameDoneHandler } from './use-pause-shift-frame-done-handler';

const SHIFT_LOG_KEY = '{"shift":true}';

const { logPauseShiftEmotionFrameHubDoneMock, showPauseStepSyncFailedToast } = vi.hoisted(() => ({
  logPauseShiftEmotionFrameHubDoneMock: vi.fn(),
  showPauseStepSyncFailedToast: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  logPauseShiftEmotionFrameHubDone: logPauseShiftEmotionFrameHubDoneMock,
  showPauseStepSyncFailedToast,
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  logPauseShiftEmotionFrameHubDoneMock.mockReset();
  vi.mocked(showPauseStepSyncFailedToast).mockClear();
});

describe('usePauseShiftFrameDoneHandler', () => {
  it('logs shift_emotion_logged once when logKey unchanged on second Im done', async () => {
    logPauseShiftEmotionFrameHubDoneMock.mockResolvedValue({
      status: 'advance',
      logKey: SHIFT_LOG_KEY,
    });

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
    expect(logPauseShiftEmotionFrameHubDoneMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.handleFrameImDone();
    });
    expect(logPauseShiftEmotionFrameHubDoneMock).toHaveBeenCalledTimes(2);
    expect(goToStep).toHaveBeenLastCalledWith('breath2');
    expect(setFrameDone).toHaveBeenCalled();
    expect(setMoodAfterDone).toHaveBeenCalled();
  });

  it('does not advance when RPC fails', async () => {
    logPauseShiftEmotionFrameHubDoneMock.mockResolvedValue({ status: 'sync_failed' });

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
    logPauseShiftEmotionFrameHubDoneMock.mockResolvedValue({
      status: 'advance',
      logKey: SHIFT_LOG_KEY,
    });

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
    expect(logPauseShiftEmotionFrameHubDoneMock).toHaveBeenCalledTimes(1);
    expect(goToStep).toHaveBeenCalledWith('breath2');
  });
});
