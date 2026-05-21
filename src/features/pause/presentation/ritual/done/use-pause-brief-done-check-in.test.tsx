import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { usePauseBriefDoneCheckIn } from './use-pause-brief-done-check-in';

const {
  runPostPauseEmotionLogIfDirtyMock,
  mockPauseRepository,
  showPauseStepSyncFailedToast,
} = vi.hoisted(() => ({
  runPostPauseEmotionLogIfDirtyMock: vi.fn(),
  mockPauseRepository: { port: 'supabasePauseRepository' },
  showPauseStepSyncFailedToast: vi.fn(),
}));

vi.mock('@/features/pause/application/use-cases/ritual/done/post-pause-emotion-log', () => ({
  runPostPauseEmotionLogIfDirty: runPostPauseEmotionLogIfDirtyMock,
}));

vi.mock('@/features/pause/infrastructure/supabase-pause-repository', () => ({
  supabasePauseRepository: mockPauseRepository,
}));

vi.mock('@/features/pause/presentation/ritual/pause-step-sync-toast', () => ({
  showPauseStepSyncFailedToast,
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  runPostPauseEmotionLogIfDirtyMock.mockReset();
  runPostPauseEmotionLogIfDirtyMock.mockResolvedValue({ status: 'logged' });
  vi.mocked(showPauseStepSyncFailedToast).mockClear();
});

describe('usePauseBriefDoneCheckIn', () => {
  it('skips RPC when feel unchanged and still calls onSaveToJourney', async () => {
    runPostPauseEmotionLogIfDirtyMock.mockResolvedValue({ status: 'skipped' });
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

    expect(runPostPauseEmotionLogIfDirtyMock).toHaveBeenCalledWith(
      mockPauseRepository,
      expect.objectContaining({
        pauseInstanceId: 'inst-1',
        mood: 'calm',
        intensity: 3,
      }),
    );
    expect(onSaveToJourney).toHaveBeenCalledOnce();
    expect(showPauseStepSyncFailedToast).not.toHaveBeenCalled();
  });

  it('logs post_pause_emotion when feel changed and sync fails shows toast', async () => {
    runPostPauseEmotionLogIfDirtyMock.mockResolvedValue({ status: 'sync_failed' });
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

    expect(runPostPauseEmotionLogIfDirtyMock).toHaveBeenCalledWith(
      mockPauseRepository,
      expect.objectContaining({
        pauseInstanceId: 'inst-1',
        mood: 'anxious',
      }),
    );
    expect(onSaveToJourney).not.toHaveBeenCalled();
    expect(showPauseStepSyncFailedToast).toHaveBeenCalledWith(t);
  });
});
