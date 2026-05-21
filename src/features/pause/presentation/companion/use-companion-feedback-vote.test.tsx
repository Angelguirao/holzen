import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useCompanionFeedbackVote } from './use-companion-feedback-vote';

const {
  runLogCompanionFeedbackVoteMock,
  mockPauseAnalyticsRepository,
  setQueryDataMock,
  hapticFeedbackMock,
} = vi.hoisted(() => ({
  runLogCompanionFeedbackVoteMock: vi.fn().mockResolvedValue({ ok: true }),
  mockPauseAnalyticsRepository: { port: 'supabasePauseAnalyticsRepository' },
  setQueryDataMock: vi.fn(),
  hapticFeedbackMock: vi.fn(),
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-log-companion-feedback-vote',
  () => ({
    runLogCompanionFeedbackVote: runLogCompanionFeedbackVoteMock,
  }),
);

vi.mock('@/features/pause/infrastructure/supabase-pause-analytics-repository', () => ({
  supabasePauseAnalyticsRepository: mockPauseAnalyticsRepository,
}));

vi.mock('@/features/auth/public', () => ({
  useAuth: () => ({ user: { id: 'user-1' } as User }),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: hapticFeedbackMock,
}));

vi.mock('@/features/pause/public-queries', () => ({
  companionFeedbackVoteQueryKey: (userId: string, pauseInstanceId: string, companionType: string) =>
    ['companion-feedback-vote', userId, pauseInstanceId, companionType] as const,
  getCompanionFeedbackVoteQueryOptions: () => ({
    queryKey: ['companion-feedback-vote'],
    queryFn: async () => null,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
  useQueryClient: () => ({
    setQueryData: setQueryDataMock,
  }),
}));

beforeEach(() => {
  runLogCompanionFeedbackVoteMock.mockReset().mockResolvedValue({ ok: true });
  setQueryDataMock.mockReset();
  hapticFeedbackMock.mockReset();
});

describe('useCompanionFeedbackVote', () => {
  it('no-ops when interaction is blocked', async () => {
    const { result } = renderHook(() =>
      useCompanionFeedbackVote({
        pauseInstanceId: 'inst-1',
        companionType: 'signal',
        interactionBlocked: true,
      }),
    );

    await act(async () => {
      await result.current.handleVote('up');
    });

    expect(runLogCompanionFeedbackVoteMock).not.toHaveBeenCalled();
  });

  it('persists vote via runLogCompanionFeedbackVote + PauseAnalyticsRepository', async () => {
    const { result } = renderHook(() =>
      useCompanionFeedbackVote({
        pauseInstanceId: 'inst-1',
        companionType: 'signal',
        cacheId: 'cache-9',
      }),
    );

    await act(async () => {
      await result.current.handleVote('down');
    });

    expect(runLogCompanionFeedbackVoteMock).toHaveBeenCalledTimes(1);
    expect(runLogCompanionFeedbackVoteMock).toHaveBeenCalledWith(
      mockPauseAnalyticsRepository,
      {
        userId: 'user-1',
        companionType: 'signal',
        vote: 'down',
        cacheId: 'cache-9',
        pauseInstanceId: 'inst-1',
      },
    );
    expect(setQueryDataMock).toHaveBeenCalled();
  });
});
