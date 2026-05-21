import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { usePauseBriefDoneCheckIn } from './use-pause-brief-done-check-in';

const { logStepMock, mockRepository, showPauseStepSyncFailedToast } = vi.hoisted(() => {
  const logStepMock = vi.fn();
  return {
    logStepMock,
    mockRepository: { logStep: logStepMock } as unknown as PauseRepository,
    showPauseStepSyncFailedToast: vi.fn(),
  };
});

vi.mock('@/features/pause/public-ports', () => ({
  supabasePauseRepository: mockRepository,
}));

vi.mock('@/features/pause/application/use-cases/ritual/step-sync-toast', () => ({
  showPauseStepSyncFailedToast,
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  logStepMock.mockReset();
  logStepMock.mockResolvedValue(null);
  vi.mocked(showPauseStepSyncFailedToast).mockClear();
});

describe('usePauseBriefDoneCheckIn', () => {
  it('skips RPC when feel unchanged and still calls onSaveToJourney', async () => {
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

    expect(logStepMock).not.toHaveBeenCalled();
    expect(onSaveToJourney).toHaveBeenCalledOnce();
    expect(showPauseStepSyncFailedToast).not.toHaveBeenCalled();
  });

  it('logs post_pause_emotion when feel changed and sync fails shows toast', async () => {
    logStepMock.mockRejectedValue(new Error('rpc failed'));
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

    expect(logStepMock).toHaveBeenCalledOnce();
    expect(onSaveToJourney).not.toHaveBeenCalled();
    expect(showPauseStepSyncFailedToast).toHaveBeenCalledWith(t);
  });
});
