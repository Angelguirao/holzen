import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import { usePauseSessionDecideHandler } from './use-pause-session-decide-handler';
import {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/application/use-cases/feedback/outcome-toast';

const { logPauseOutcomeMock, clearSessionMock, invalidatePauseStatsMock } = vi.hoisted(() => ({
  logPauseOutcomeMock: vi.fn(),
  clearSessionMock: vi.fn(),
  invalidatePauseStatsMock: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  logPauseOutcome: (params: { pauseInstanceId: string | null; decision: string }) =>
    logPauseOutcomeMock(params),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

vi.mock('@/features/pause/public-queries', () => ({
  invalidatePauseStatsDataForUser: (...args: unknown[]) => invalidatePauseStatsMock(...args),
}));

vi.mock('@/features/pause/application/use-cases/feedback/outcome-toast', () => ({
  showPauseOutcomeSaveFailedToast: vi.fn(),
  showPauseOutcomeNotCompletedToast: vi.fn(),
}));

vi.mock('@/features/pause/infrastructure/session/persisted-session-storage', () => ({
  clearSession: () => clearSessionMock(),
  loadSession: () => null,
  saveSession: vi.fn(),
}));

vi.mock('@/features/pause/public', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/pause/public')>();
  return {
    ...actual,
    getSessionQuote: () => ({ text: 'Q', author: 'A' }),
  };
});

vi.mock('@/features/auth/public', () => ({
  useAuth: () => ({
    user: { id: 'user-decide-handler-test' } as import('@supabase/supabase-js').User,
    loading: false,
    signOut: async () => {},
  }),
}));

const t = ((k: string) => k) as TFunction;

function baseInput(overrides: Partial<Parameters<typeof usePauseSessionDecideHandler>[0]> = {}) {
  const decidingRef: MutableRefObject<boolean> = { current: false };
  return {
    decidingRef,
    pauseInstanceId: null as string | null,
    t,
    refreshSubscription: vi.fn(),
    setDecision: vi.fn(),
    dismissMessage: vi.fn().mockResolvedValue(undefined),
    setPauseImpactData: vi.fn(),
    setPhase: vi.fn(),
    context: null as string | null,
    selectedMood: null,
    selectedMoodAfter: null,
    ritualEntry: 'deep' as const,
    breathingFirstCompleted: true,
    breathingSecondCompleted: true,
    feelIntensity: null as number | null,
    shiftIntensity: null as number | null,
    reflectionMessage: 'Reflection text',
    haiku: null as string | null,
    ...overrides,
  };
}

beforeEach(() => {
  logPauseOutcomeMock.mockReset();
  clearSessionMock.mockReset();
  invalidatePauseStatsMock.mockReset();
  vi.mocked(showPauseOutcomeSaveFailedToast).mockClear();
  vi.mocked(showPauseOutcomeNotCompletedToast).mockClear();
});

describe('usePauseSessionDecideHandler', () => {
  it('completes without outcome RPC when no pause instance id', async () => {
    logPauseOutcomeMock.mockResolvedValueOnce({ status: 'no_instance' });
    const input = baseInput();
    const { result } = renderHook(() => usePauseSessionDecideHandler(input));
    await act(async () => {
      await result.current.handleDecide('hold');
    });
    expect(logPauseOutcomeMock).toHaveBeenCalledWith({
      pauseInstanceId: null,
      decision: 'hold',
    });
    expect(invalidatePauseStatsMock).not.toHaveBeenCalled();
    expect(input.setDecision).toHaveBeenCalledWith('hold');
    expect(clearSessionMock).toHaveBeenCalled();
    expect(input.setPhase).toHaveBeenCalledWith('done');
    expect(input.decidingRef.current).toBe(false);
  });

  it('logs outcome and completes when RPC returns completed', async () => {
    logPauseOutcomeMock.mockResolvedValueOnce({ status: 'completed' });
    const input = baseInput({ pauseInstanceId: 'pi-1' });
    const { result } = renderHook(() => usePauseSessionDecideHandler(input));
    await act(async () => {
      await result.current.handleDecide('hold');
    });
    expect(logPauseOutcomeMock).toHaveBeenCalledTimes(1);
    expect(logPauseOutcomeMock.mock.calls[0][0]).toEqual({
      pauseInstanceId: 'pi-1',
      decision: 'hold',
    });
    expect(invalidatePauseStatsMock).not.toHaveBeenCalled();
    expect(input.refreshSubscription).toHaveBeenCalled();
    expect(input.setDecision).toHaveBeenCalledWith('hold');
    expect(clearSessionMock).toHaveBeenCalled();
  });

  it('toasts and aborts when outcome RPC throws', async () => {
    logPauseOutcomeMock.mockResolvedValueOnce({ status: 'sync_failed' });
    const input = baseInput({ pauseInstanceId: 'pi-1' });
    const { result } = renderHook(() => usePauseSessionDecideHandler(input));
    await act(async () => {
      await result.current.handleDecide('hold');
    });
    expect(showPauseOutcomeSaveFailedToast).toHaveBeenCalledWith(t);
    expect(invalidatePauseStatsMock).not.toHaveBeenCalled();
    expect(input.setDecision).not.toHaveBeenCalled();
    expect(clearSessionMock).not.toHaveBeenCalled();
  });

  it('toasts and refreshes subscription when outcome is not completed', async () => {
    logPauseOutcomeMock.mockResolvedValueOnce({
      status: 'not_completed',
      outcomeState: 'pending',
    });
    const input = baseInput({ pauseInstanceId: 'pi-1' });
    const { result } = renderHook(() => usePauseSessionDecideHandler(input));
    await act(async () => {
      await result.current.handleDecide('hold');
    });
    expect(showPauseOutcomeNotCompletedToast).toHaveBeenCalledWith(t);
    expect(invalidatePauseStatsMock).toHaveBeenCalledWith('user-decide-handler-test');
    expect(input.refreshSubscription).toHaveBeenCalled();
    expect(input.setDecision).not.toHaveBeenCalled();
    expect(clearSessionMock).not.toHaveBeenCalled();
  });
});
