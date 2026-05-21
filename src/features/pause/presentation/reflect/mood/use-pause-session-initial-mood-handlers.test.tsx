import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import { usePauseSessionInitialMoodHandlers } from './use-pause-session-initial-mood-handlers';

const {
  runInitialEmotionSelectMock,
  runInitialEmotionSkipMock,
  showPauseStepSyncFailedToast,
} = vi.hoisted(() => ({
  runInitialEmotionSelectMock: vi.fn(),
  runInitialEmotionSkipMock: vi.fn(),
  showPauseStepSyncFailedToast: vi.fn(),
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log', async () => {
  const mood = await vi.importActual<
    typeof import('@/features/pause/domain/reflect/mood/initial-emotion-presentation')
  >('@/features/pause/domain/reflect/mood/initial-emotion-presentation');
  return {
    runInitialEmotionSelect: runInitialEmotionSelectMock,
    runInitialEmotionSkip: runInitialEmotionSkipMock,
    initialEmotionResetUi: mood.initialEmotionResetUi,
  };
});

vi.mock('@/features/pause/application/use-cases/ritual/step-sync-toast', () => ({
  showPauseStepSyncFailedToast,
}));

vi.mock('@/features/pause/infrastructure/supabase-pause-repository', () => ({
  supabasePauseRepository: {},
}));

const syncedSelectUi = {
  moodDone: true,
  selectedMood: 'calm' as const,
  feelIntensity: 3,
  selectedBriefFace: null,
};

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  runInitialEmotionSelectMock.mockReset();
  runInitialEmotionSkipMock.mockReset();
  runInitialEmotionSelectMock.mockResolvedValue({
    status: 'synced',
    logKey: 'calm:3',
    ui: syncedSelectUi,
  });
  runInitialEmotionSkipMock.mockResolvedValue({
    status: 'synced',
    logKey: '{"skipped":true}',
    ui: { moodDone: true, feelIntensity: null },
  });
  vi.mocked(showPauseStepSyncFailedToast).mockClear();
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
  it('dedupes identical mood select so facade runs once per distinct outcome', async () => {
    runInitialEmotionSelectMock
      .mockResolvedValueOnce({ status: 'synced', logKey: 'calm:3', ui: syncedSelectUi })
      .mockResolvedValueOnce({ status: 'deduped', ui: syncedSelectUi });
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
    expect(runInitialEmotionSelectMock).toHaveBeenCalledTimes(1);
    expect(lastFeelLogKeyRef.current).toBe('calm:3');
    await act(async () => {
      await result.current.handleMoodSelect('calm', 3);
    });
    expect(runInitialEmotionSelectMock).toHaveBeenCalledTimes(2);
    expect(lastFeelLogKeyRef.current).toBe('calm:3');
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
    expect(runInitialEmotionSkipMock).toHaveBeenCalledTimes(1);
    expect(deps.setMoodDone).toHaveBeenCalledWith(true);
  });

  it('shows step-sync toast when select RPC fails', async () => {
    runInitialEmotionSelectMock.mockResolvedValueOnce({
      status: 'sync_failed',
      ui: {
        moodDone: false,
        selectedMood: null,
        feelIntensity: null,
        selectedBriefFace: null,
      },
    });
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
    expect(showPauseStepSyncFailedToast).toHaveBeenCalledWith(t);
    expect(lastFeelLogKeyRef.current).toBeNull();
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
