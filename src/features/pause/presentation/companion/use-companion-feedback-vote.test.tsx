import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useCompanionFeedbackVote } from './use-companion-feedback-vote';

const { logCompanionFeedbackVoteMock, setQueryDataMock, hapticFeedbackMock } = vi.hoisted(() => ({
  logCompanionFeedbackVoteMock: vi.fn().mockResolvedValue({ ok: true }),
  setQueryDataMock: vi.fn(),
  hapticFeedbackMock: vi.fn(),
}));

vi.mock('@/features/pause/presentation/companion/pause-companion-analytics-io', () => ({
  logCompanionFeedbackVote: logCompanionFeedbackVoteMock,
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
  logCompanionFeedbackVoteMock.mockReset().mockResolvedValue({ ok: true });
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

    expect(logCompanionFeedbackVoteMock).not.toHaveBeenCalled();
  });

  it('persists vote via logCompanionFeedbackVote', async () => {
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

    expect(logCompanionFeedbackVoteMock).toHaveBeenCalledTimes(1);
    expect(logCompanionFeedbackVoteMock).toHaveBeenCalledWith({
      userId: 'user-1',
      companionType: 'signal',
      vote: 'down',
      cacheId: 'cache-9',
      pauseInstanceId: 'inst-1',
    });
    expect(setQueryDataMock).toHaveBeenCalled();
  });
});
