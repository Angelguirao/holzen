import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { usePauseBriefDoneCheckIn } from './use-pause-brief-done-check-in';

const { logPostPauseEmotionIfDirtyMock, showPauseStepSyncFailedToast } = vi.hoisted(() => ({
  logPostPauseEmotionIfDirtyMock: vi.fn(),
  showPauseStepSyncFailedToast: vi.fn(),
}));

vi.mock('@/features/pause/application/use-cases/ritual/step-sync-toast', () => ({
  showPauseStepSyncFailedToast,
}));

vi.mock('@/features/pause/public-rpc', () => ({
  logPostPauseEmotionIfDirty: logPostPauseEmotionIfDirtyMock,
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  logPostPauseEmotionIfDirtyMock.mockReset();
  logPostPauseEmotionIfDirtyMock.mockResolvedValue({ status: 'ok' });
  vi.mocked(showPauseStepSyncFailedToast).mockClear();
});

describe('usePauseBriefDoneCheckIn', () => {
  it('skips RPC when feel unchanged and still calls onSaveToJourney', async () => {
    logPostPauseEmotionIfDirtyMock.mockResolvedValue({ status: 'skipped' });
    const onSaveToJourney = vi.fn();
    const { result } = renderHook(() =>
      usePauseBriefDoneCheckIn({
        doneVariant: 'brief',
        pauseInstanceId: 'inst-1',
        pauseData: { mood: 'calm', feelIntensity: 3 },
        onSaveToJourney,
        t,
      }),
    );

    await act(async () => {
      await result.current.handleSaveToJourney();
    });

    expect(logPostPauseEmotionIfDirtyMock).toHaveBeenCalledOnce();
    expect(onSaveToJourney).toHaveBeenCalledOnce();
    expect(showPauseStepSyncFailedToast).not.toHaveBeenCalled();
  });

  it('logs post_pause_emotion when feel changed and sync fails shows toast', async () => {
    logPostPauseEmotionIfDirtyMock.mockResolvedValue({ status: 'sync_failed' });
    const onSaveToJourney = vi.fn();
    const { result } = renderHook(() =>
      usePauseBriefDoneCheckIn({
        doneVariant: 'brief',
        pauseInstanceId: 'inst-1',
        pauseData: { mood: 'calm', feelIntensity: 3 },
        onSaveToJourney,
        t,
      }),
    );

    act(() => {
      result.current.setBriefDoneMood('anxious');
    });

    await act(async () => {
      await result.current.handleSaveToJourney();
    });

    expect(logPostPauseEmotionIfDirtyMock).toHaveBeenCalledOnce();
    expect(onSaveToJourney).not.toHaveBeenCalled();
    expect(showPauseStepSyncFailedToast).toHaveBeenCalledWith(t);
  });
});
