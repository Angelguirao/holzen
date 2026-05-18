/**
 * Public API for the pause bounded context (no Supabase eager load).
 * RPC mutations: `@/features/pause/public-rpc`.
 */
export { pauseCreateSkippedUserMessage } from './application/use-cases/create-skipped-message';
export {
  buildPauseImpactDataOnComplete,
  type BuildPauseImpactDataOnCompleteInput,
  type PauseImpactData,
} from './application/use-cases/impact-data';
export {
  isPausePersistError,
  isReflectionPersistError,
  reflectionPersistErrorMessage,
  PAUSE_PERSIST_ERROR_MARKER,
  REFLECTION_PERSIST_ERROR_MARKER,
} from './application/use-cases/reflection-persist-error';
export { pauseArchiveRowAllowsRetrospectiveOutcome } from './application/archive/retrospective-outcome';
export {
  resolvePauseBreathSecondLabelVariant,
  viteWantsPauseBreathSecondLabelShift,
  type PauseBreathSecondLabelVariant,
} from './application/breathing/breath-second-label-variant';
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
  getInterventionIdempotencyDecision,
  hasInvokedIntervention,
  resetInterventionIdempotency,
  runOnceIntervention,
  type InterventionIdempotencyDecision,
} from './application/companion/intervention-idempotency';
export {
  reflectGenerationPrerequisite,
  type ReflectGenerationPrerequisite,
} from './application/reflect/generation-prerequisites';
export {
  BOX_BREATH_PHASE_COUNT,
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
  type BreathingPhaseAdvanceResult,
} from './application/breathing/phase-advance';
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
export { showPauseFavoriteProHintToast } from './application/feedback/favorite-toast';
export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './application/feedback/outcome-toast';
export { showPauseStepSyncFailedToast } from './application/feedback/step-sync-toast';
export {
  buildFetchedPauseInstanceFromFetch,
  type PauseAiArtifactKindRow,
  type PauseInstanceContextSnapshotRow,
} from './application/session/fetched-instance-from-fetch';
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
