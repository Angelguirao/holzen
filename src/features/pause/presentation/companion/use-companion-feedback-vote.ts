import { useCallback, useOptimistic, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { hapticFeedback } from '@/lib/haptics';
import { logCompanionFeedbackVote } from '@/features/pause/presentation/companion/pause-companion-analytics-io';
import {
  companionFeedbackVoteQueryKey,
  getCompanionFeedbackVoteQueryOptions,
} from '@/features/pause/public-queries';

export function useCompanionFeedbackVote(options: {
  pauseInstanceId?: string | null;
  companionType: string;
  cacheId?: string | null;
  /** When true, blocks new votes (e.g. companion regenerate in flight). */
  interactionBlocked?: boolean;
}) {
  const { pauseInstanceId, companionType, cacheId, interactionBlocked = false } = options;
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const { data: persistedVote = null } = useQuery(
    getCompanionFeedbackVoteQueryOptions(userId, pauseInstanceId, companionType),
  );

  const [vote, addOptimisticVote] = useOptimistic(
    persistedVote,
    (_current, next: 'up' | 'down' | null) => next,
  );

  const handleVote = useCallback(
    (type: 'up' | 'down') => {
      if (vote || isPending || interactionBlocked) return;
      if (!userId) return;

      const committedVote = persistedVote;
      startTransition(async () => {
        addOptimisticVote(type);
        hapticFeedback('light');

        try {
          const { ok } = await logCompanionFeedbackVote({
            userId,
            companionType,
            vote: type,
            cacheId,
            pauseInstanceId,
          });
          if (!ok) {
            addOptimisticVote(committedVote);
            return;
          }
          if (pauseInstanceId) {
            queryClient.setQueryData<'up' | 'down' | null>(
              companionFeedbackVoteQueryKey(userId, pauseInstanceId, companionType),
              type,
            );
          }
        } catch {
          addOptimisticVote(committedVote);
        }
      });
    },
    [
      vote,
      isPending,
      interactionBlocked,
      userId,
      persistedVote,
      addOptimisticVote,
      pauseInstanceId,
      companionType,
      cacheId,
      queryClient,
    ],
  );

  return { vote, loading: isPending, handleVote };
}
