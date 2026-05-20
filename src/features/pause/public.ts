/**
 * Public API for the pause bounded context (no Supabase eager load).
 * RPC mutations: `@/features/pause/public-rpc`.
 */
export {
  type FetchedPauseInstance,
  type PersistedSession,
} from './domain/session-model';
export {
  effectivePauseShiftIntensity,
  effectivePauseShiftMood,
  hasPauseShiftOrPostEmotion,
  type PauseEmotionFields,
} from './domain/effective-emotion';
export {
  bucketChangePercent,
  computeContextFingerprint,
} from './domain/pause-fingerprint';
export {
  PAUSE_QUALITY_WEIGHTS,
  computePauseQualityScore,
  type PauseQualityBreakdown,
} from './domain/pause-quality';
export { COMPANION_TYPES, FEEDBACK_TO_CACHE_TYPE } from './domain/companion-types';
export {
  DEFAULT_PREGENERATE_CACHE_TOPUP,
  PREGENERATE_CACHE_TOPUP_KEYS,
  mergePregenerateCacheTopup,
} from './domain/pregenerate-cache-topup-config';
export type {
  PregenerateCacheTopupConfig,
  PregenerateCacheTopupKey,
  PregenerateCacheTopupTypeConfig,
} from './domain/pregenerate-cache-topup-config';
export {
  type NotificationNavigateState,
  type PauseSessionLocationState,
  type PauseSessionNavParsed,
  type PauseSeverity,
  parsePauseSessionLocationState,
} from './application/use-cases/session/location-state';
export {
  collectStepTypes,
  computePauseState,
  countedCompanionCount,
  decideCronFire,
  pauseInstanceHasBriefRitualTag,
  shouldCountCompanion,
  type CronFireDecision,
  type PauseCompanionAction,
  type PauseCompanionEventRow,
  type PauseCompanionNonCountingReason,
  type PauseExpiredReason,
  type PauseInstanceRow,
  type PauseState,
  type PauseStepEventRow,
  type PauseStepType,
  type PauseTemplateRow,
} from './domain/pause-state';
