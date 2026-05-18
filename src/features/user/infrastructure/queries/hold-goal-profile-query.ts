import { getProfileRowQueryOptions } from '@/features/user/infrastructure/queries/profile-row-query';
import type { ProfileRow } from '@/features/user/domain/user-profile-row';
import { mapProfileRowToHoldGoal } from '@/features/user/application/map-profile-row-to-hold-goal';
import type { HoldGoalProfile } from '@/features/user/domain/hold-goal-profile';

export type { HoldGoalProfile } from '@/features/user/domain/hold-goal-profile';

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

export type HoldGoalProfileQueryData = HoldGoalProfile | null;
