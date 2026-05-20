import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import {
  dedupeBiases,
  type RelatedBias,
} from '@/features/pause/application/use-cases/ritual/frame/related-biases';
import { getRelatedBiasesGroundNudgeQueryOptions } from '../../public-queries';

/** Grounding full view — distinct bias titles from recent `ground_nudge` artifacts. */
export function useRelatedBiasesThisMonth(options: {
  currentPauseInstanceId?: string | null;
  currentTitle?: string | null;
  limit?: number;
}) {
  const { currentPauseInstanceId, currentTitle, limit = 8 } = options;
  const { user } = useAuth();
  const userId = user?.id;

  const { data: rawRows } = useQuery(getRelatedBiasesGroundNudgeQueryOptions(userId));

  const biases = useMemo((): RelatedBias[] | null => {
    if (!userId) return null;
    if (rawRows === undefined) return null;
    return dedupeBiases(rawRows, {
      currentPauseInstanceId: currentPauseInstanceId ?? null,
      currentTitle: currentTitle ?? null,
      limit,
    });
  }, [userId, rawRows, currentPauseInstanceId, currentTitle, limit]);

  return { biases };
}
