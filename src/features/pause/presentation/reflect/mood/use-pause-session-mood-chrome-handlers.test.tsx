import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import { usePauseSessionMoodChromeHandlers } from './use-pause-session-mood-chrome-handlers';

const {
  resolvePauseSessionChromeCloseActionMock,
  runPauseSessionChromeCloseActionMock,
  usePauseFavoriteToggleMock,
  usePauseSessionMoodAndPersistMock,
  mockMoodBundle,
  mockToggleFavorite,
} = vi.hoisted(() => {
  const mockMoodBundle = { handleMoodSelect: vi.fn(), handleMoodSkip: vi.fn() };
  const mockToggleFavorite = vi.fn();
  return {
    resolvePauseSessionChromeCloseActionMock: vi.fn(),
    runPauseSessionChromeCloseActionMock: vi.fn(),
    usePauseFavoriteToggleMock: vi.fn(() => ({ toggleFavorite: mockToggleFavorite })),
    usePauseSessionMoodAndPersistMock: vi.fn(() => mockMoodBundle),
    mockMoodBundle,
    mockToggleFavorite,
  };
});

vi.mock('@/features/pause/domain/reflect/mood/pause-session-mood-chrome-flow', () => ({
  resolvePauseSessionChromeCloseAction: resolvePauseSessionChromeCloseActionMock,
  runPauseSessionChromeCloseAction: runPauseSessionChromeCloseActionMock,
}));

vi.mock('../steps/use-pause-favorite-toggle', () => ({
  usePauseFavoriteToggle: usePauseFavoriteToggleMock,
}));

vi.mock('./use-pause-session-mood-and-persist', () => ({
  usePauseSessionMoodAndPersist: usePauseSessionMoodAndPersistMock,
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
    pauseInstanceId: 'pi-chrome-1',
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
  resolvePauseSessionChromeCloseActionMock.mockReset();
  runPauseSessionChromeCloseActionMock.mockReset();
  usePauseFavoriteToggleMock.mockClear();
  usePauseSessionMoodAndPersistMock.mockClear();
  mockToggleFavorite.mockClear();
  resolvePauseSessionChromeCloseActionMock.mockReturnValue('request_exit');
});

describe('usePauseSessionMoodChromeHandlers', () => {
  it('composes mood-and-persist and favorite-toggle child hooks', () => {
    const providers = baseProviders();
    const shell = baseShell();
    const ritual = baseRitual();

    const { result } = renderHook(() =>
      usePauseSessionMoodChromeHandlers(providers, { shell, ritual }),
    );

    expect(usePauseSessionMoodAndPersistMock).toHaveBeenCalledOnce();
    expect(usePauseFavoriteToggleMock).toHaveBeenCalledWith({
      pauseInstanceId: 'pi-chrome-1',
      isFavorite: false,
      setIsFavorite: ritual.setIsFavorite,
      subscribed: true,
      t,
    });
    expect(result.current.mood).toBe(mockMoodBundle);
    expect(result.current.toggleFavorite).toBe(mockToggleFavorite);
  });

  it('chrome close delegates to domain flow and requests exit in-session', () => {
    const providers = baseProviders();
    const shell = baseShell();
    const ritual = baseRitual({ phase: 'session' });
    resolvePauseSessionChromeCloseActionMock.mockReturnValue('request_exit');

    const { result } = renderHook(() =>
      usePauseSessionMoodChromeHandlers(providers, { shell, ritual }),
    );

    act(() => {
      result.current.handlePauseSessionChromeClose();
    });

    expect(resolvePauseSessionChromeCloseActionMock).toHaveBeenCalledWith('session');
    expect(runPauseSessionChromeCloseActionMock).toHaveBeenCalledWith('request_exit', {
      onReturn: providers.handleReturn,
      onRequestExit: shell.requestExitPauseBeforeDone,
    });
  });

  it('chrome close returns home when ritual phase is done', () => {
    const providers = baseProviders();
    const shell = baseShell();
    const ritual = baseRitual({ phase: 'done' });
    resolvePauseSessionChromeCloseActionMock.mockReturnValue('return');

    const { result } = renderHook(() =>
      usePauseSessionMoodChromeHandlers(providers, { shell, ritual }),
    );

    act(() => {
      result.current.handlePauseSessionChromeClose();
    });

    expect(resolvePauseSessionChromeCloseActionMock).toHaveBeenCalledWith('done');
    expect(runPauseSessionChromeCloseActionMock).toHaveBeenCalledWith('return', {
      onReturn: providers.handleReturn,
      onRequestExit: shell.requestExitPauseBeforeDone,
    });
  });
});
