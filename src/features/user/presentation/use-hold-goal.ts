import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { getHoldGoalProfileQueryOptions } from '../public-queries';
import type { HoldGoalProfile } from '../public';

export type { HoldGoalProfile };

/**
 * Hold-goal row fields used for stats alignment. Shared by Journey (Profile) and
 * Home’s compact score so the Holzen number matches the full Stats tab.
 *
 * Reads through the same TanStack cache as `useProfile` / `HoldGoalWidget` (`PROFILE_QUERY_KEY`).
 */
export function useHoldGoalProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery(getHoldGoalProfileQueryOptions(userId));
}
