/**
 * Pause RPC mutations (loads Supabase client). Import from here in hooks/tests —
 * not from `public.ts`, which stays free of infrastructure side effects.
 */
export {
  pauseAdoptPendingOffer,
  pauseCreateOrReuse,
  pauseDeclinePendingOffer,
  pauseDismissCurrent,
  pauseLogCompanion,
  pauseLogStep,
  type PauseAdoptPendingResult,
  type PauseCreateOrReuseResult,
  type PauseLogCompanionResult,
} from './infrastructure/pause-rpc-client';

export {
  logPauseRitualDepthUpgraded,
  ritualDepthUpgradedPayload,
} from './application/session/ritual-depth-upgrade';

export {
  applyBulkHoldOutcomes,
  type BulkHoldApplyResult,
} from './application/use-cases/apply-bulk-hold-outcomes';
