import { normalizeTrackedAssetId } from '@/features/market/public';
import type { HoldGoalProfile } from '@/features/user/domain/hold-goal-profile';
import type { ProfileRow } from '@/features/user/domain/user-profile-row';

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
