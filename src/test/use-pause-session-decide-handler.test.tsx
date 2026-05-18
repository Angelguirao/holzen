import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import { usePauseSessionDecideHandler } from '@/hooks/use-pause-session-decide-handler';
import {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/public';

const { pauseLogStepMock, clearSessionMock, invalidatePauseStatsMock } = vi.hoisted(() => ({
  pauseLogStepMock: vi.fn(),
  clearSessionMock: vi.fn(),
  invalidatePauseStatsMock: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  pauseLogStep: (...args: unknown[]) => pauseLogStepMock(...args),
}));

vi.mock('@/lib/wisdom-quotes', () => ({
  getSessionQuote: () => ({ text: 'Q', author: 'A' }),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

vi.mock('@/features/pause/public', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/pause/public')>();
  return {
    ...actual,
    clearSession: () => clearSessionMock(),
    invalidatePauseStatsDataForUser: (...args: unknown[]) => invalidatePauseStatsMock(...args),
    showPauseOutcomeSaveFailedToast: vi.fn(),
    showPauseOutcomeNotCompletedToast: vi.fn(),
  };
});

vi.mock('@/hooks/use-auth', () => ({
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
  pauseLogStepMock.mockReset();
  clearSessionMock.mockReset();
  invalidatePauseStatsMock.mockReset();
  vi.mocked(showPauseOutcomeSaveFailedToast).mockClear();
  vi.mocked(showPauseOutcomeNotCompletedToast).mockClear();
});

describe('usePauseSessionDecideHandler', () => {
  it('completes without outcome RPC when no pause instance id', async () => {
    const input = baseInput();
    const { result } = renderHook(() => usePauseSessionDecideHandler(input));
    await act(async () => {
      await result.current.handleDecide('hold');
    });
    expect(pauseLogStepMock).not.toHaveBeenCalled();
    expect(invalidatePauseStatsMock).not.toHaveBeenCalled();
    expect(input.setDecision).toHaveBeenCalledWith('hold');
    expect(clearSessionMock).toHaveBeenCalled();
    expect(input.setPhase).toHaveBeenCalledWith('done');
    expect(input.decidingRef.current).toBe(false);
  });

  it('logs outcome and completes when RPC returns completed', async () => {
    pauseLogStepMock.mockResolvedValueOnce('completed');
    const input = baseInput({ pauseInstanceId: 'pi-1' });
    const { result } = renderHook(() => usePauseSessionDecideHandler(input));
    await act(async () => {
      await result.current.handleDecide('hold');
    });
    expect(pauseLogStepMock).toHaveBeenCalledTimes(1);
    expect(pauseLogStepMock.mock.calls[0][0].stepType).toBe('outcome_logged');
    expect(invalidatePauseStatsMock).not.toHaveBeenCalled();
    expect(input.refreshSubscription).toHaveBeenCalled();
    expect(input.setDecision).toHaveBeenCalledWith('hold');
    expect(clearSessionMock).toHaveBeenCalled();
  });

  it('toasts and aborts when outcome RPC throws', async () => {
    pauseLogStepMock.mockRejectedValueOnce(new Error('network'));
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
    pauseLogStepMock.mockResolvedValueOnce('pending');
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
