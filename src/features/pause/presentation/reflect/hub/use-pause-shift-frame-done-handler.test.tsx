import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import { buildShiftEmotionFrameHubLogBundle } from '@/features/pause/domain/reflect/hub/shift-emotion-log';
import { usePauseShiftFrameDoneHandler } from './use-pause-shift-frame-done-handler';

const { logKey: SHIFT_LOG_KEY } = buildShiftEmotionFrameHubLogBundle();

const { runShiftEmotionFrameHubDoneMock, showPauseStepSyncFailedToast, mockPauseRepository } =
  vi.hoisted(() => ({
    runShiftEmotionFrameHubDoneMock: vi.fn(),
    showPauseStepSyncFailedToast: vi.fn(),
    mockPauseRepository: { port: 'reflectPauseRepository' },
  }));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done',
  () => ({
    runShiftEmotionFrameHubDone: runShiftEmotionFrameHubDoneMock,
  }),
);

vi.mock('./pause-reflect-hub-io', () => ({
  reflectPauseRepository: mockPauseRepository,
}));

vi.mock('@/features/pause/presentation/ritual/pause-step-sync-toast', () => ({
  showPauseStepSyncFailedToast,
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  runShiftEmotionFrameHubDoneMock.mockReset();
  vi.mocked(showPauseStepSyncFailedToast).mockClear();
});

describe('usePauseShiftFrameDoneHandler', () => {
  it('logs shift_emotion_logged once when logKey unchanged on second Im done', async () => {
    runShiftEmotionFrameHubDoneMock.mockResolvedValue({
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
    expect(runShiftEmotionFrameHubDoneMock).toHaveBeenCalledTimes(1);
    expect(runShiftEmotionFrameHubDoneMock).toHaveBeenCalledWith(mockPauseRepository, {
      pauseInstanceId: 'pi-1',
      lastShiftLogKey: null,
    });
    await act(async () => {
      await result.current.handleFrameImDone();
    });
    expect(runShiftEmotionFrameHubDoneMock).toHaveBeenCalledTimes(2);
    expect(runShiftEmotionFrameHubDoneMock).toHaveBeenLastCalledWith(mockPauseRepository, {
      pauseInstanceId: 'pi-1',
      lastShiftLogKey: SHIFT_LOG_KEY,
    });
    expect(goToStep).toHaveBeenLastCalledWith('breath2');
    expect(setFrameDone).toHaveBeenCalled();
    expect(setMoodAfterDone).toHaveBeenCalled();
  });

  it('does not advance when RPC fails', async () => {
    runShiftEmotionFrameHubDoneMock.mockResolvedValue({ status: 'sync_failed' });

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

  it('routes shift frame hub RPC through the default PauseRepository port adapter', async () => {
    runShiftEmotionFrameHubDoneMock.mockResolvedValue({
      status: 'advance',
      logKey: SHIFT_LOG_KEY,
    });

    const lastShiftLogKeyRef: MutableRefObject<string | null> = { current: null };
    const { result } = renderHook(() =>
      usePauseShiftFrameDoneHandler({
        pauseInstanceId: 'pi-1',
        t,
        lastShiftLogKeyRef,
        setFrameDone: vi.fn(),
        setMoodAfterDone: vi.fn(),
        goToStep: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleFrameImDone();
    });

    expect(runShiftEmotionFrameHubDoneMock).toHaveBeenCalledWith(mockPauseRepository, {
      pauseInstanceId: 'pi-1',
      lastShiftLogKey: null,
    });
    expect(mockPauseRepository.port).toBe('reflectPauseRepository');
  });

  it('advances without RPC when no pause instance id', async () => {
    runShiftEmotionFrameHubDoneMock.mockResolvedValue({
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
    expect(runShiftEmotionFrameHubDoneMock).toHaveBeenCalledTimes(1);
    expect(runShiftEmotionFrameHubDoneMock).toHaveBeenCalledWith(mockPauseRepository, {
      pauseInstanceId: null,
      lastShiftLogKey: null,
    });
    expect(goToStep).toHaveBeenCalledWith('breath2');
  });
});
