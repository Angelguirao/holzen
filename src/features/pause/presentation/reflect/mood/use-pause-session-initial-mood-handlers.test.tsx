import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
} from '@/features/pause/domain/reflect/mood/initial-emotion-presentation';
import { usePauseSessionInitialMoodHandlers } from './use-pause-session-initial-mood-handlers';

const CALM_LOG_KEY = '{"mood":"calm","intensity":3}';

const {
  runInitialEmotionSelectMock,
  runInitialEmotionSkipMock,
  showPauseStepSyncFailedToast,
  mockPauseRepository,
} = vi.hoisted(() => ({
  runInitialEmotionSelectMock: vi.fn(),
  runInitialEmotionSkipMock: vi.fn(),
  showPauseStepSyncFailedToast: vi.fn(),
  mockPauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log', () => ({
  runInitialEmotionSelect: runInitialEmotionSelectMock,
  runInitialEmotionSkip: runInitialEmotionSkipMock,
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: mockPauseRepository,
}));

vi.mock('@/features/pause/presentation/ritual/pause-step-sync-toast', () => ({
  showPauseStepSyncFailedToast,
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  runInitialEmotionSelectMock.mockReset();
  runInitialEmotionSkipMock.mockReset();
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
  it('dedupes identical mood select so runInitialEmotionSelect runs twice but only syncs once', async () => {
    runInitialEmotionSelectMock.mockImplementation(async (_repo, input) => {
      if (input.lastFeelLogKey === CALM_LOG_KEY) {
        return {
          status: 'deduped' as const,
          ui: {
            moodDone: true,
            selectedMood: 'calm',
            feelIntensity: 3,
            selectedBriefFace: null,
          },
        };
      }
      return {
        status: 'synced' as const,
        logKey: CALM_LOG_KEY,
        ui: {
          moodDone: true,
          selectedMood: 'calm',
          feelIntensity: 3,
          selectedBriefFace: null,
        },
      };
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
    expect(runInitialEmotionSelectMock).toHaveBeenCalledTimes(1);
    expect(runInitialEmotionSelectMock).toHaveBeenCalledWith(mockPauseRepository, {
      pauseInstanceId: 'pi-1',
      mood: 'calm',
      intensity: 3,
      opts: undefined,
      lastFeelLogKey: null,
    });
    expect(lastFeelLogKeyRef.current).toBe(CALM_LOG_KEY);
    await act(async () => {
      await result.current.handleMoodSelect('calm', 3);
    });
    expect(runInitialEmotionSelectMock).toHaveBeenCalledTimes(2);
    expect(lastFeelLogKeyRef.current).toBe(CALM_LOG_KEY);
  });

  it('logs skipped initial emotion on skip when instance id present', async () => {
    runInitialEmotionSkipMock.mockResolvedValue({
      status: 'synced',
      logKey: '{"skipped":true}',
      ui: { moodDone: true, feelIntensity: null },
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
      await result.current.handleMoodSkip();
    });
    expect(runInitialEmotionSkipMock).toHaveBeenCalledTimes(1);
    expect(runInitialEmotionSkipMock).toHaveBeenCalledWith(mockPauseRepository, {
      pauseInstanceId: 'pi-1',
    });
    expect(deps.setMoodDone).toHaveBeenCalledWith(true);
  });

  it('shows step-sync toast when select RPC fails', async () => {
    runInitialEmotionSelectMock.mockResolvedValue({
      status: 'sync_failed',
      ui: initialEmotionSelectRollbackUi(),
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

  it('routes initial emotion RPC through the default PauseRepository port adapter', async () => {
    runInitialEmotionSelectMock.mockResolvedValue({
      status: 'synced',
      logKey: CALM_LOG_KEY,
      ui: {
        moodDone: true,
        selectedMood: 'calm',
        feelIntensity: 3,
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

    expect(runInitialEmotionSelectMock).toHaveBeenCalledWith(mockPauseRepository, {
      pauseInstanceId: 'pi-1',
      mood: 'calm',
      intensity: 3,
      opts: undefined,
      lastFeelLogKey: null,
    });
    expect(mockPauseRepository.port).toBe('supabasePauseRepository');
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
