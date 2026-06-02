import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import {
  EMPTY_PRACTICE_SUMMARY,
  type PracticeSummary,
} from '@/features/pause/domain/practice/practice-summary';
import { getPracticeSummaryQueryOptions } from '@/features/pause/infrastructure/queries/practice-summary-query';

export type { PracticeSummary };

export function usePracticeSummary(): {
  summary: PracticeSummary | null;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const userId = user?.id;
  const { data, isPending } = useQuery(getPracticeSummaryQueryOptions(userId));

  if (!userId) return { summary: null, isLoading: false };
  if (isPending && data === undefined) return { summary: null, isLoading: true };

  return {
    summary: data ?? EMPTY_PRACTICE_SUMMARY,
    isLoading: false,
  };
}
