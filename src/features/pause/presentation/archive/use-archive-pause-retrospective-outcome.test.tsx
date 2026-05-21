import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

const { logStepMock, mockRepository, trackRetrospectiveMock, invalidateStatsMock } = vi.hoisted(
  () => {
    const logStepMock = vi.fn().mockResolvedValue(null);
    return {
      logStepMock,
      mockRepository: { logStep: logStepMock } as unknown as PauseRepository,
      trackRetrospectiveMock: vi.fn(),
      invalidateStatsMock: vi.fn(),
    };
  },
);

vi.mock('@/features/pause/public-ports', () => ({
  supabasePauseRepository: mockRepository,
}));

vi.mock('@/features/pause/application/use-cases/archive/archive-retrospective-telemetry', () => ({
  trackPauseOutcomeRetrospective: trackRetrospectiveMock,
}));

vi.mock('@/features/pause/public-queries', () => ({
  invalidatePauseStatsDataForUser: invalidateStatsMock,
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useArchivePauseRetrospectiveOutcome } from './use-archive-pause-retrospective-outcome';

const t = ((key: string) => key) as Parameters<
  typeof useArchivePauseRetrospectiveOutcome
>[0]['t'];

beforeEach(() => {
  vi.clearAllMocks();
  logStepMock.mockResolvedValue(null);
});

describe('useArchivePauseRetrospectiveOutcome', () => {
  it('handleDecide logs outcome via repository port', async () => {
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useArchivePauseRetrospectiveOutcome({
        instanceId: 'inst-1',
        userId: 'user-1',
        onOpenChange,
        onSuccess,
        t,
      }),
    );

    await act(async () => {
      result.current.handleDecide('held');
    });

    expect(logStepMock).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceId: 'inst-1',
        stepType: 'outcome_logged',
      }),
    );
    expect(trackRetrospectiveMock).toHaveBeenCalledWith({
      pauseInstanceId: 'inst-1',
      outcome: 'held',
    });
    expect(invalidateStatsMock).toHaveBeenCalledWith('user-1');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSuccess).toHaveBeenCalled();
  });
});
