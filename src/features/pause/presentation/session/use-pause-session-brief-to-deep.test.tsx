import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { logPauseRitualDepthUpgradedMock, showPauseStepSyncFailedToast, mockPauseRepository } =
  vi.hoisted(() => ({
    logPauseRitualDepthUpgradedMock: vi.fn().mockResolvedValue({ status: 'success' as const }),
    showPauseStepSyncFailedToast: vi.fn(),
    mockPauseRepository: { port: 'supabasePauseRepository' },
  }));

vi.mock('@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade', () => ({
  logPauseRitualDepthUpgraded: logPauseRitualDepthUpgradedMock,
}));

vi.mock('@/features/pause/infrastructure/supabase-pause-repository', () => ({
  supabasePauseRepository: mockPauseRepository,
}));

vi.mock('@/features/pause/presentation/ritual/pause-step-sync-toast', () => ({
  showPauseStepSyncFailedToast,
}));

import { usePauseSessionBriefToDeep } from './use-pause-session-brief-to-deep';

function baseInput(overrides: Partial<Parameters<typeof usePauseSessionBriefToDeep>[0]> = {}) {
  return {
    subLoading: false,
    subscribed: true,
    ritualEntry: 'brief' as const,
    pauseInstanceId: 'pause-1',
    t: ((key: string) => key) as Parameters<typeof usePauseSessionBriefToDeep>[0]['t'],
    requirePro: vi.fn(() => true),
    setRitualEntry: vi.fn(),
    setSwipeDirection: vi.fn(),
    setStep: vi.fn(),
    setBriefStep: vi.fn(),
    setBriefIntegrateDone: vi.fn(),
    setBreathingFirstCompleted: vi.fn(),
    setBreathingSecondCompleted: vi.fn(),
    setBreathTimedActive: vi.fn(),
    setBreathFirstTimedPatternStarted: vi.fn(),
    setFrameDone: vi.fn(),
    setMoodAfterDone: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePauseSessionBriefToDeep', () => {
  it('resets deep ritual to picker when user is not subscribed', async () => {
    const setRitualEntry = vi.fn();
    renderHook(() =>
      usePauseSessionBriefToDeep(
        baseInput({
          ritualEntry: 'deep',
          subscribed: false,
          setRitualEntry,
        }),
      ),
    );
    await waitFor(() => {
      expect(setRitualEntry).toHaveBeenCalledWith('picker');
    });
  });

  it('handleBriefSwitchToDeepPause bails when requirePro fails', async () => {
    const requirePro = vi.fn(() => false);
    const setStep = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionBriefToDeep(baseInput({ requirePro, setStep })),
    );
    await act(async () => {
      await result.current.handleBriefSwitchToDeepPause();
    });
    expect(requirePro).toHaveBeenCalledWith('deep_pause');
    expect(logPauseRitualDepthUpgradedMock).not.toHaveBeenCalled();
    expect(setStep).not.toHaveBeenCalled();
  });

  it('handleBriefSwitchToDeepPause applies deep snapshot after RPC', async () => {
    const setStep = vi.fn();
    const setRitualEntry = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionBriefToDeep(baseInput({ setStep, setRitualEntry })),
    );
    await act(async () => {
      await result.current.handleBriefSwitchToDeepPause();
    });
    expect(logPauseRitualDepthUpgradedMock).toHaveBeenCalledWith(mockPauseRepository, 'pause-1');
    expect(setRitualEntry).toHaveBeenCalledWith('deep');
    expect(setStep).toHaveBeenCalledWith('reflect');
  });

  it('handleBriefSwitchToDeepPause bails when RPC sync fails', async () => {
    logPauseRitualDepthUpgradedMock.mockResolvedValueOnce({ status: 'sync_failed' });
    const setStep = vi.fn();
    const t = ((key: string) => key) as Parameters<typeof usePauseSessionBriefToDeep>[0]['t'];
    const { result } = renderHook(() =>
      usePauseSessionBriefToDeep(baseInput({ setStep, t })),
    );
    await act(async () => {
      await result.current.handleBriefSwitchToDeepPause();
    });
    expect(logPauseRitualDepthUpgradedMock).toHaveBeenCalledWith(mockPauseRepository, 'pause-1');
    expect(showPauseStepSyncFailedToast).toHaveBeenCalledWith(t);
    expect(setStep).not.toHaveBeenCalled();
  });
});
