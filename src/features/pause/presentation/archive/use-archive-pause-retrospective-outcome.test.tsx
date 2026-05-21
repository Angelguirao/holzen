import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const {
  pauseArchiveLogRetrospectiveOutcomeMock,
  trackRetrospectiveMock,
  invalidateStatsMock,
} = vi.hoisted(() => ({
  pauseArchiveLogRetrospectiveOutcomeMock: vi.fn().mockResolvedValue(null),
  trackRetrospectiveMock: vi.fn(),
  invalidateStatsMock: vi.fn(),
}));

vi.mock('./pause-archive-io', () => ({
  pauseArchiveLogRetrospectiveOutcome: pauseArchiveLogRetrospectiveOutcomeMock,
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry',
  () => ({
    trackPauseOutcomeRetrospective: trackRetrospectiveMock,
  }),
);

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
  pauseArchiveLogRetrospectiveOutcomeMock.mockResolvedValue(null);
});

describe('useArchivePauseRetrospectiveOutcome', () => {
  it('handleDecide logs outcome via archive presentation I/O', async () => {
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

    expect(pauseArchiveLogRetrospectiveOutcomeMock).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      outcome: 'held',
    });
    expect(trackRetrospectiveMock).toHaveBeenCalledWith({
      pauseInstanceId: 'inst-1',
      outcome: 'held',
    });
    expect(invalidateStatsMock).toHaveBeenCalledWith('user-1');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSuccess).toHaveBeenCalled();
  });
});
