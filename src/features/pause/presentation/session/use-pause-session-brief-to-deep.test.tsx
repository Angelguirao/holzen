import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

const { logPauseRitualDepthUpgradedMock, mockRepository } = vi.hoisted(() => ({
  logPauseRitualDepthUpgradedMock: vi.fn().mockResolvedValue(true),
  mockRepository: { logStep: vi.fn() } as unknown as PauseRepository,
}));

vi.mock('@/features/pause/public-ports', () => ({
  supabasePauseRepository: mockRepository,
}));

vi.mock('@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade', () => ({
  logPauseRitualDepthUpgraded: (...args: unknown[]) => logPauseRitualDepthUpgradedMock(...args),
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
    expect(logPauseRitualDepthUpgradedMock).toHaveBeenCalledWith(
      mockRepository,
      'pause-1',
      expect.any(Function),
    );
    expect(setRitualEntry).toHaveBeenCalledWith('deep');
    expect(setStep).toHaveBeenCalledWith('reflect');
  });
});
