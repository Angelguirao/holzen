/** Public API for user — export only what other features may import (no Supabase). */
export { isAdminFromEnvList } from './application/is-admin-env';
export {
  computeHoldGoalCompactHeadline,
  type HoldGoalHeadlineGoal,
} from './application/hold-goal-headline';
export type { HoldGoalProfile } from './domain/hold-goal-profile';
export type { UserSignalPreference } from './domain/user-signal-preference';
export { NotificationBell } from './presentation/NotificationBell';
