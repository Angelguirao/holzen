import type { HoldGoalProfile } from '@/features/user/domain/hold-goal-profile';
import type { ProfileRow } from '@/features/user/domain/user-profile-row';

export function mapProfileRowToHoldGoal(_row: ProfileRow | null): HoldGoalProfile | null {
  // Hold-goal goal fields dropped from profiles; legacy widget cannot hydrate saved goals.
  return null;
}
