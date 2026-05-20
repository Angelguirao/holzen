/**
 * Public API for the pause bounded context (no Supabase eager load).
 * Cross-context types and legacy stats helpers only — feature internals import
 * domain / use-case modules directly. RPC: `public-rpc`. Hooks: `public-hooks`.
 */
export type { NotificationNavigateState } from './application/use-cases/session/location-state';
export {
  effectivePauseShiftIntensity,
  effectivePauseShiftMood,
  hasPauseShiftOrPostEmotion,
  type PauseEmotionFields,
} from './domain/effective-emotion';
export {
  type PauseCompanionEventRow,
  type PauseCompanionNonCountingReason,
  type PauseExpiredReason,
  type PauseState,
  type PauseStepEventRow,
  type PauseStepType,
} from './domain/pause-state';
export type { PersistedSession } from './domain/session-model';
