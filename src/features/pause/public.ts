/**
 * Public API for the pause bounded context.
 * Other features import from `@/features/pause/public` only — not deep paths.
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
export { pauseCreateSkippedUserMessage } from './application/use-cases/create-skipped-message';
export {
  BRIEF_PAUSE_ORDER,
  computeBriefMacroProgressPosition,
} from './application/brief-ritual/brief-pause-order';
export {
  computeBriefRitualGoBack,
  type BriefRitualGoBackResult,
} from './application/brief-ritual/brief-pause-go-back';
export {
  computeBriefPastStepClick,
  type BriefPastStepClickResult,
} from './application/brief-ritual/brief-pause-past-step-click';
export {
  hasPersistablePauseSessionAnchor,
  hasPersistedPauseSessionPayload,
  type PersistedSessionAnchor,
} from './application/session/persisted-session-guards';
export {
  TERMINAL_PAUSE_DB_STATES,
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
} from './application/session/terminal-entry-guard';
export {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type ManualPauseTriggerResult,
} from './domain/manual-pause-trigger-result';
export {
  PAUSE_RITUAL_SCHEMA_VERSION,
  type BriefPauseStep,
  type RitualDepth,
} from './domain/ritual-types';
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
