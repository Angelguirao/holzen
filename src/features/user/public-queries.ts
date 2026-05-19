/**
 * User TanStack query modules (imports Supabase). App hooks/screens only —
 * other features should use `@/features/user/public` (no eager Supabase).
 */
export {
  getUserSignalPreferencesQueryOptions,
  USER_SIGNAL_PREFS_QUERY_KEY,
  type UserPref,
} from './infrastructure/queries/user-signal-preferences-query';
export {
  fetchProfileRowForUser,
  getProfileRowQueryOptions,
  PROFILE_QUERY_KEY,
  type ProfileRow,
} from './infrastructure/queries/profile-row-query';
export { getHoldGoalProfileQueryOptions } from './infrastructure/queries/hold-goal-profile-query';
