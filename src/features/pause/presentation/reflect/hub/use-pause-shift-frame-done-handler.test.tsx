import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import { buildShiftEmotionFrameHubLogBundle } from '@/features/pause/application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow';
import { usePauseShiftFrameDoneHandler } from './use-pause-shift-frame-done-handler';

const { logKey: SHIFT_LOG_KEY } = buildShiftEmotionFrameHubLogBundle();

const { pauseShiftEmotionFrameHubDoneMock, showPauseStepSyncFailedToast } = vi.hoisted(() => ({
  pauseShiftEmotionFrameHubDoneMock: vi.fn(),
  showPauseStepSyncFailedToast: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

vi.mock('./pause-reflect-hub-io', async () => {
  const domain = await import(
    '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation'
  );
  return {
    pauseShiftEmotionFrameHubDone: pauseShiftEmotionFrameHubDoneMock,
    resolveShiftFrameHubDonePresentation: domain.resolveShiftFrameHubDonePresentation,
  };
});

vi.mock('@/features/pause/presentation/ritual/pause-step-sync-toast', () => ({
  showPauseStepSyncFailedToast,
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  pauseShiftEmotionFrameHubDoneMock.mockReset();
  vi.mocked(showPauseStepSyncFailedToast).mockClear();
});

describe('usePauseShiftFrameDoneHandler', () => {
  it('logs shift_emotion_logged once when logKey unchanged on second Im done', async () => {
    pauseShiftEmotionFrameHubDoneMock.mockResolvedValue({
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
    expect(pauseShiftEmotionFrameHubDoneMock).toHaveBeenCalledTimes(1);
    expect(pauseShiftEmotionFrameHubDoneMock).toHaveBeenCalledWith({
      pauseInstanceId: 'pi-1',
      lastShiftLogKey: null,
    });
    await act(async () => {
      await result.current.handleFrameImDone();
    });
    expect(pauseShiftEmotionFrameHubDoneMock).toHaveBeenCalledTimes(2);
    expect(pauseShiftEmotionFrameHubDoneMock).toHaveBeenLastCalledWith({
      pauseInstanceId: 'pi-1',
      lastShiftLogKey: SHIFT_LOG_KEY,
    });
    expect(goToStep).toHaveBeenLastCalledWith('breath2');
    expect(setFrameDone).toHaveBeenCalled();
    expect(setMoodAfterDone).toHaveBeenCalled();
  });

  it('does not advance when RPC fails', async () => {
    pauseShiftEmotionFrameHubDoneMock.mockResolvedValue({ status: 'sync_failed' });

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
    pauseShiftEmotionFrameHubDoneMock.mockResolvedValue({
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
    expect(pauseShiftEmotionFrameHubDoneMock).toHaveBeenCalledTimes(1);
    expect(pauseShiftEmotionFrameHubDoneMock).toHaveBeenCalledWith({
      pauseInstanceId: null,
      lastShiftLogKey: null,
    });
    expect(goToStep).toHaveBeenCalledWith('breath2');
  });
});
