import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getProfileRowQueryOptions } from '@/hooks/use-profile';
import type { Database } from '@/integrations/supabase/types';
import { normalizeTrackedAssetId } from '@/lib/tracked-assets';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface HoldGoalProfile {
  type: string | null;
  targetMonths: number | null;
  targetPrice: number | null;
  start: string | null;
  trackedAssetId: string;
}

function mapProfileRowToHoldGoal(row: ProfileRow | null): HoldGoalProfile | null {
  if (!row) return null;
  return {
    type: row.hold_goal_type,
    targetMonths: row.hold_goal_target_months,
    targetPrice: row.hold_goal_target_price,
    start: row.hold_goal_start,
    trackedAssetId: normalizeTrackedAssetId(row.tracked_asset_id),
  };
}

/**
 * Hold-goal row fields used for stats alignment. Shared by Journey (Profile) and
 * Home’s compact score so the Holzen number matches the full Stats tab.
 *
 * Reads through the same TanStack cache as `useProfile` / `HoldGoalWidget` (`PROFILE_QUERY_KEY`).
 */
export function useHoldGoalProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    ...getProfileRowQueryOptions(userId),
    select: (row: ProfileRow | null) => mapProfileRowToHoldGoal(row),
  });
}
