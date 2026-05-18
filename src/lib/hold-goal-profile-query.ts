import { getProfileRowQueryOptions } from '@/features/user/public';
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

export function mapProfileRowToHoldGoal(row: ProfileRow | null): HoldGoalProfile | null {
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
 * Same TanStack cache as `useProfile` / `HoldGoalWidget`, with a `select` that
 * projects hold-goal fields for Journey + Home stat tiles.
 */
export function getHoldGoalProfileQueryOptions(userId: string | undefined) {
  return {
    ...getProfileRowQueryOptions(userId),
    select: (row: ProfileRow | null) => mapProfileRowToHoldGoal(row),
  } as const;
}
