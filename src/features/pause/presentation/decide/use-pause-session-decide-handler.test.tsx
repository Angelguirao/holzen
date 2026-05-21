import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { runPauseOutcomeLog } from '@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log';
import {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
} from '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-flow';
import { usePauseSessionDecideHandler } from './use-pause-session-decide-handler';
import type { UsePauseSessionDecideHandlerParams } from './pause-session-decide-handler-types';

const {
  logStepMock,
  clearSessionMock,
  invalidatePauseStatsMock,
  mockRepository,
  showPauseOutcomeSaveFailedToast,
  showPauseOutcomeNotCompletedToast,
} = vi.hoisted(() => {
  const logStepMock = vi.fn();
  return {
    logStepMock,
    clearSessionMock: vi.fn(),
    invalidatePauseStatsMock: vi.fn(),
    mockRepository: { logStep: logStepMock } as unknown as PauseRepository,
    showPauseOutcomeSaveFailedToast: vi.fn(),
    showPauseOutcomeNotCompletedToast: vi.fn(),
  };
});

vi.mock('@/features/pause/public-ports', () => ({
  supabasePauseRepository: mockRepository,
}));

vi.mock('@/features/pause/application/use-cases/ritual/decide/outcome-toast', () => ({
  showPauseOutcomeSaveFailedToast,
  showPauseOutcomeNotCompletedToast,
}));

vi.mock('@/features/pause/application/use-cases/session/wisdom-quotes', () => ({
  getSessionQuote: () => ({ text: 'Q', author: 'A' }),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

vi.mock('@/features/pause/public-queries', () => ({
  invalidatePauseStatsDataForUser: (...args: unknown[]) => invalidatePauseStatsMock(...args),
}));

vi.mock('@/features/pause/infrastructure/session/persisted-session-storage', () => ({
  clearSession: () => clearSessionMock(),
  loadSession: () => null,
  saveSession: vi.fn(),
}));

vi.mock('@/features/auth/public', () => ({
  useAuth: () => ({
    user: { id: 'user-decide-handler-test' } as import('@supabase/supabase-js').User,
    loading: false,
    signOut: async () => {},
  }),
}));

const t = ((k: string) => k) as TFunction;

function baseInput(overrides: Partial<UsePauseSessionDecideHandlerParams> = {}) {
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
  logStepMock.mockReset();
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
    expect(logStepMock).not.toHaveBeenCalled();
    expect(invalidatePauseStatsMock).not.toHaveBeenCalled();
    expect(input.setDecision).toHaveBeenCalledWith('hold');
    expect(clearSessionMock).toHaveBeenCalled();
    expect(input.setPhase).toHaveBeenCalledWith('done');
    expect(input.decidingRef.current).toBe(false);
  });

  it('logs outcome and completes when RPC returns completed', async () => {
    logStepMock.mockResolvedValueOnce('completed');
    const input = baseInput({ pauseInstanceId: 'pi-1' });
    const { result } = renderHook(() => usePauseSessionDecideHandler(input));
    await act(async () => {
      await result.current.handleDecide('hold');
    });
    expect(logStepMock).toHaveBeenCalledTimes(1);
    expect(logStepMock.mock.calls[0][0]).toMatchObject({
      instanceId: 'pi-1',
      stepType: 'outcome_logged',
    });
    expect(invalidatePauseStatsMock).not.toHaveBeenCalled();
    expect(input.refreshSubscription).toHaveBeenCalled();
    expect(input.setDecision).toHaveBeenCalledWith('hold');
    expect(clearSessionMock).toHaveBeenCalled();
  });

  it('toasts and aborts when outcome RPC throws', async () => {
    logStepMock.mockRejectedValueOnce(new Error('rpc failed'));
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
    logStepMock.mockResolvedValueOnce('pending');
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
