import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import { usePauseSessionMoodChromeHandlers } from './use-pause-session-mood-chrome-handlers';

const { runInitialEmotionSelectMock, runPauseFavoriteToggleMock, invalidateQueriesMock, mockPauseRepository } =
  vi.hoisted(() => ({
    runInitialEmotionSelectMock: vi.fn(),
    runPauseFavoriteToggleMock: vi.fn(),
    invalidateQueriesMock: vi.fn(),
    mockPauseRepository: { port: 'supabasePauseRepository' },
  }));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log', () => ({
  runInitialEmotionSelect: runInitialEmotionSelectMock,
  runInitialEmotionSkip: vi.fn(),
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle',
  () => ({
    runPauseFavoriteToggle: runPauseFavoriteToggleMock,
  }),
);

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

vi.mock('@/features/pause/public-queries', () => ({
  pauseArchiveListQueryPrefix: (userId: string) => ['pause-archive', userId] as const,
}));

vi.mock('@/features/pause/presentation/reflect/steps/pause-favorite-pro-hint-toast', () => ({
  showPauseFavoriteProHintToast: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock('@/features/auth/public', () => ({
  useAuth: () => ({ user: { id: 'archive-user-1' }, loading: false }),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

const t = ((k: string) => k) as TFunction;
const companions = {} as CompanionData;
const companionPrefs = {} as CompanionPrefs;

function baseProviders() {
  return {
    t,
    handleReturn: vi.fn(),
    subscribed: true,
    requirePro: vi.fn().mockReturnValue(true),
  };
}

function baseShell(
  overrides: Partial<Parameters<typeof usePauseSessionMoodChromeHandlers>[1]['shell']> = {},
) {
  return {
    message: 'msg',
    context: null,
    pauseInstanceId: 'pi-1',
    companions,
    companionPrefs,
    severity: 'mild' as const,
    requestExitPauseBeforeDone: vi.fn(),
    ...overrides,
  };
}

function baseRitual(
  overrides: Partial<Parameters<typeof usePauseSessionMoodChromeHandlers>[1]['ritual']> = {},
) {
  return {
    phase: 'session' as const,
    ritualEntry: 'deep' as const,
    moodDone: false,
    moodAfterDone: false,
    selectedMood: null,
    selectedMoodAfter: null,
    feelIntensity: null,
    shiftIntensity: null,
    decision: null,
    step: 'feel' as PauseStep,
    breathingFirstCompleted: false,
    breathingSecondCompleted: false,
    frameDone: false,
    briefStep: 'feel' as const,
    briefIntegrateDone: false,
    selectedBriefFace: null,
    isFavorite: false,
    setIsFavorite: vi.fn(),
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
  runPauseFavoriteToggleMock.mockReset().mockResolvedValue({ status: 'success', newValue: true });
  invalidateQueriesMock.mockClear();
});

describe('usePauseSessionMoodChromeHandlers port-lock', () => {
  it('routes favorite toggle through default PauseRepository adapter', async () => {
    const setIsFavorite = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionMoodChromeHandlers(baseProviders(), {
        shell: baseShell(),
        ritual: baseRitual({ isFavorite: false, setIsFavorite }),
      }),
    );

    await act(async () => {
      await result.current.toggleFavorite();
    });

    expect(runPauseFavoriteToggleMock).toHaveBeenCalledWith(mockPauseRepository, {
      pauseInstanceId: 'pi-1',
      isFavorite: false,
    });
  });

  it('routes feel-tile mood select through default PauseRepository adapter', async () => {
    const { result } = renderHook(() =>
      usePauseSessionMoodChromeHandlers(baseProviders(), {
        shell: baseShell(),
        ritual: baseRitual(),
      }),
    );

    await act(async () => {
      result.current.mood.onFeelTilesSelect('calm', 2, 'calm');
    });

    expect(runInitialEmotionSelectMock).toHaveBeenCalledWith(
      mockPauseRepository,
      expect.objectContaining({
        pauseInstanceId: 'pi-1',
        mood: 'calm',
        intensity: 2,
      }),
    );
  });
});
