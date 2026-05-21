import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import { usePauseSessionMoodAndPersist } from './use-pause-session-mood-and-persist';

const { runInitialEmotionSelectMock, mockPauseRepository } = vi.hoisted(() => ({
  runInitialEmotionSelectMock: vi.fn(),
  mockPauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log', () => ({
  runInitialEmotionSelect: runInitialEmotionSelectMock,
  runInitialEmotionSkip: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: mockPauseRepository,
}));

vi.mock('../../session/use-pause-session-ritual-storage-sync', () => ({
  usePauseSessionRitualStorageSync: vi.fn(),
}));

vi.mock('../../session/use-pause-session-persist-to-storage', () => ({
  usePauseSessionPersistToStorage: vi.fn(),
}));

vi.mock('@/features/pause/presentation/ritual/pause-step-sync-toast', () => ({
  showPauseStepSyncFailedToast: vi.fn(),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

const t = ((k: string) => k) as TFunction;

const companions = {} as CompanionData;
const companionPrefs = {} as CompanionPrefs;

function baseParams(
  overrides: Partial<Parameters<typeof usePauseSessionMoodAndPersist>[0]> = {},
) {
  return {
    pauseInstanceId: 'pi-1',
    t,
    requirePro: vi.fn().mockReturnValue(true),
    ritualEntry: 'deep' as const,
    message: 'msg',
    context: null,
    companions,
    companionPrefs,
    severity: 'mild' as const,
    moodDone: false,
    moodAfterDone: false,
    selectedMood: null,
    selectedMoodAfter: null,
    feelIntensity: null,
    shiftIntensity: null,
    phase: 'session' as const,
    decision: null,
    step: 'feel' as PauseStep,
    breathingFirstCompleted: false,
    breathingSecondCompleted: false,
    frameDone: false,
    briefStep: 'feel' as const,
    briefIntegrateDone: false,
    selectedBriefFace: null,
    setRitualEntry: vi.fn(),
    setBriefStep: vi.fn(),
    setBriefIntegrateDone: vi.fn(),
    setSelectedBriefFace: vi.fn(),
    setMoodDone: vi.fn(),
    setSelectedMood: vi.fn(),
    setFeelIntensity: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  runInitialEmotionSelectMock.mockReset().mockResolvedValue({
    status: 'synced',
    logKey: '{"mood":"calm","intensity":2}',
    ui: {
      moodDone: true,
      selectedMood: 'calm',
      feelIntensity: 2,
      selectedBriefFace: 'calm',
    },
  });
});

describe('usePauseSessionMoodAndPersist', () => {
  it('routes feel-tile mood select through default PauseRepository adapter', async () => {
    const { result } = renderHook(() => usePauseSessionMoodAndPersist(baseParams()));

    await act(async () => {
      result.current.onFeelTilesSelect('calm', 2, 'calm');
    });

    expect(runInitialEmotionSelectMock).toHaveBeenCalledWith(mockPauseRepository, {
      pauseInstanceId: 'pi-1',
      mood: 'calm',
      intensity: 2,
      opts: { briefFace: 'calm' },
      lastFeelLogKey: null,
    });
    expect(mockPauseRepository.port).toBe('supabasePauseRepository');
  });

  it('brief ritual adds briefRitual to feel-tile mood log options', async () => {
    const { result } = renderHook(() =>
      usePauseSessionMoodAndPersist(baseParams({ ritualEntry: 'brief' })),
    );

    await act(async () => {
      result.current.onFeelTilesSelect('calm', 2, 'calm');
    });

    expect(runInitialEmotionSelectMock).toHaveBeenCalledWith(mockPauseRepository, {
      pauseInstanceId: 'pi-1',
      mood: 'calm',
      intensity: 2,
      opts: { briefRitual: true, briefFace: 'calm' },
      lastFeelLogKey: null,
    });
  });
});
