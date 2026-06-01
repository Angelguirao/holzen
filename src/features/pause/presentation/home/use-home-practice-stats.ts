import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import {
  getHomePracticeStatsQueryOptions,
  type HomePracticeStats,
} from '../../infrastructure/queries/home-practice-stats-query';

export type { HomePracticeStats };

export function useHomePracticeStats(): {
  stats: HomePracticeStats | null;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const userId = user?.id;
  const { data, isPending } = useQuery(getHomePracticeStatsQueryOptions(userId));

  if (!userId) return { stats: null, isLoading: false };
  if (isPending && data === undefined) return { stats: null, isLoading: true };

  return {
    stats: data ?? { completedPauseCount: 0, presenceXp: 0 },
    isLoading: false,
  };
}
