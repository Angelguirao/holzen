/**
 * Public API for the pause bounded context.
 * Other features import from `@/features/pause/public` only — not deep paths.
 */
export {
  bucketChangePercent,
  computeContextFingerprint,
} from './domain/pause-fingerprint';
export {
  PAUSE_QUALITY_WEIGHTS,
  computePauseQualityScore,
  type PauseQualityBreakdown,
} from './domain/pause-quality';
export {
  collectStepTypes,
  computePauseState,
  countedCompanionCount,
  decideCronFire,
  pauseInstanceHasBriefRitualTag,
  pauseWindowShowsClockCountdown,
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
