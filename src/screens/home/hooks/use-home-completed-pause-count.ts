import { useQuery } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { getCompletedPauseCountQueryOptions } from '@/features/pause/public-queries';

/**
 * Exact count of completed pauses for testimonial prompt eligibility.
 * Shares the TanStack cache with {@link useCompletedPauseCount} (Tools hub).
 */
export function useHomeCompletedPauseCount(user: User | null): number {
  const userId = user?.id;
  const { data = 0 } = useQuery(getCompletedPauseCountQueryOptions(userId));
  return userId ? data : 0;
}
