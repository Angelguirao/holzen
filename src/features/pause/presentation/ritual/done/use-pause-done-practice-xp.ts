import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';
import { estimatePresenceXpFromImpact } from '@/features/pause/domain/done/estimate-presence-xp-from-impact';
import {
  fetchPauseInstancePracticeXpAwarded,
  pauseInstancePracticeXpQueryKey,
} from '@/features/pause/infrastructure/queries/pause-instance-practice-xp-query';

/** Done summary Presence row — prefers `practice_xp_awarded`, falls back to client estimate. */
export function usePauseDonePracticeXp(
  pauseInstanceId: string | null | undefined,
  pauseData: PauseImpactData | null | undefined,
  postCheckInXpBonus = 0,
) {
  const estimatedXp = useMemo(() => {
    if (!pauseData) return null;
    return estimatePresenceXpFromImpact(pauseData) + postCheckInXpBonus;
  }, [pauseData, postCheckInXpBonus]);

  const query = useQuery({
    queryKey: pauseInstancePracticeXpQueryKey(pauseInstanceId),
    queryFn: () => fetchPauseInstancePracticeXpAwarded(pauseInstanceId!),
    enabled: Boolean(pauseInstanceId),
  });

  const presenceXp = useMemo(() => {
    if (estimatedXp == null) return null;
    if (query.data == null) return estimatedXp;
    if (postCheckInXpBonus > 0 && query.data < estimatedXp) return estimatedXp;
    return query.data;
  }, [estimatedXp, postCheckInXpBonus, query.data]);

  return {
    presenceXp,
    isServerAwarded: query.data != null,
    refetchPracticeXp: query.refetch,
  };
}
