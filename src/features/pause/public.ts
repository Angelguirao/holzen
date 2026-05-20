/**
 * Public API for the pause bounded context (no Supabase eager load).
 * Cross-context types and legacy stats helpers only — feature internals import
 * domain / use-case modules directly. RPC: `public-rpc`. Hooks: `public-hooks`.
 * Navigation deep links: `public-navigation`.
 */
export type { PersistedSession } from './domain/session-model';

export {
  effectivePauseShiftIntensity,
  effectivePauseShiftMood,
  hasPauseShiftOrPostEmotion,
  type PauseEmotionFields,
} from './domain/effective-emotion';
export type {
  PauseCompanionEventRow,
  PauseCompanionNonCountingReason,
  PauseExpiredReason,
  PauseState,
  PauseStepEventRow,
  PauseStepType,
} from './domain/pause-state';
