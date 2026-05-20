import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { hapticFeedback } from '@/lib/haptics';
import {
  companionFeedbackVoteQueryKey,
  getCompanionFeedbackVoteQueryOptions,
  logCompanionFeedbackVote,
} from '../public-queries';

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
  const [optimisticVote, setOptimisticVote] = useState<'up' | 'down' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOptimisticVote(null);
  }, [pauseInstanceId, companionType, userId]);

  const { data: persistedVote = null } = useQuery(
    getCompanionFeedbackVoteQueryOptions(userId, pauseInstanceId, companionType),
  );

  const vote = optimisticVote ?? persistedVote;

  const handleVote = useCallback(
    async (type: 'up' | 'down') => {
      if (vote || loading || interactionBlocked) return;
      if (!userId) return;
      setLoading(true);
      setOptimisticVote(type);
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
          setOptimisticVote(null);
          return;
        }
        if (pauseInstanceId) {
          queryClient.setQueryData<'up' | 'down' | null>(
            companionFeedbackVoteQueryKey(userId, pauseInstanceId, companionType),
            type,
          );
          setOptimisticVote(null);
        }
        // No pause_instance_id: prior UI kept local vote only (no server read key); leave optimistic set.
      } catch {
        setOptimisticVote(null);
      } finally {
        setLoading(false);
      }
    },
    [vote, loading, interactionBlocked, userId, pauseInstanceId, companionType, cacheId, queryClient],
  );

  return { vote, loading, handleVote };
}
