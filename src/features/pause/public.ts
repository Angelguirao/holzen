/**
 * Public API for the pause bounded context (no Supabase eager load).
 * RPC mutations: `@/features/pause/public-rpc`.
 */
export { buildOutcomeLoggedPayload } from './application/use-cases/ritual/decide/outcome-log-payload';
export {
  computeBriefRitualGoBack,
  type BriefRitualGoBackResult,
} from './application/use-cases/ritual/brief/brief-pause-go-back';
export {
  computeBriefPastStepClick,
  type BriefPastStepClickResult,
} from './application/use-cases/ritual/brief/brief-pause-past-step-click';
export {
  hasPersistablePauseSessionAnchor,
  hasPersistedPauseSessionPayload,
  type PersistedSessionAnchor,
} from './application/use-cases/session/persisted-session-guards';
export {
  TERMINAL_PAUSE_DB_STATES,
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
} from './application/use-cases/session/terminal-entry-guard';
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
  type FetchedPauseInstance,
  type PersistedSession,
} from './domain/session-model';
export { migratePersistedPauseSession } from './application/use-cases/session/migrate-persisted-session';
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
export {
  buildFetchedPauseInstanceFromFetch,
  type PauseAiArtifactKindRow,
  type PauseInstanceContextSnapshotRow,
} from './application/use-cases/session/fetched-instance-from-fetch';
export {
  computePauseStorageRitualSyncPatch,
  type PauseStorageRitualSyncPatch,
} from './application/use-cases/session/storage-ritual-sync';
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
export type { PauseStep } from './domain/pause-ritual-steps';
export type { PauseSessionShellHolzen } from './domain/pause-session-shell-holzen';
export {
  type NotificationNavigateState,
  type PauseSessionLocationState,
  type PauseSessionNavParsed,
  type PauseSeverity,
  parsePauseSessionLocationState,
} from './application/use-cases/session/location-state';
export { canNavigateToPauseSession } from './application/use-cases/session/can-navigate-to-pause-session';
export {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
} from './application/use-cases/session/header-back';
export {
  BRIEF_SWITCH_TO_DEEP_STEP,
  briefSwitchToDeepPauseState,
  type BriefSwitchToDeepPauseState,
} from './application/use-cases/ritual/deep/brief-switch-to-deep';
export {
  briefStepToPauseScienceStep,
  mapPersistedStep,
  initialRitualEntry,
  initialBriefPauseStepFromRestored,
  initialBriefIntegrateDoneFromRestored,
  initialSelectedBriefFaceFromRestored,
  initialPhaseFromRestored,
  initialDecisionFromRestored,
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialFrameDoneFromRestored,
  initialBreathSegmentRpcLoggedFlagsFromRestored,
} from './application/use-cases/session/step-map';
export { coalescePauseSessionShellViewModel } from './application/use-cases/session/shell-view-model';
export {
  isPauseSessionDepthPickerActive,
  isPauseSessionWaitingForInstanceFetch,
} from './application/use-cases/session/gate-flags';
export {
  computePauseSessionHydration,
  computePauseSessionResolved,
  type PauseSessionHydrationInput,
  type PauseSessionHydrationReady,
  type PauseSessionHydrationState,
  type PauseSessionResolvedInput,
} from './application/use-cases/session/hydration';
export { buildPauseSessionScaffoldRitualDerived } from './application/use-cases/session/scaffold-ritual-derived';
export {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './application/use-cases/session/step-bundles';
export type {
  PauseSessionStepRitualBundleInput,
  PauseSessionStepShellBundleInput,
  PauseSessionStepShellChromeInput,
} from './application/use-cases/session/step-bundle-types';
export {
  buildPauseSessionMountLogParams,
  type PauseSessionMountLogParams,
} from './application/use-cases/session/mount-log-params';
export {
  buildPauseSessionPersistSnapshot,
  type PauseSessionPersistSnapshotInput,
} from './application/use-cases/session/persist-snapshot';
export { computePauseGoBackPlan } from './application/use-cases/session/go-back-plan';
export { pauseStepSwipeDirection } from './application/use-cases/session/step-swipe-direction';
export {
  buildPostPauseEmotionLoggedPayload,
  isPostPauseEmotionDirty,
  type PostPauseFeelSnapshot,
} from './application/use-cases/ritual/done/post-pause-emotion-log';
export type { CompanionSlotRelaxationUi } from './application/use-cases/ritual/frame/orchestrate-slot-apply';
export type { PauseSessionShellViewModel } from './application/use-cases/session/shell-view-model';
export { canAdvanceFromPauseStep } from './application/use-cases/session/navigation';
export { computeDeepRitualGoBackTarget } from './application/use-cases/ritual/deep/deep-go-back';
export { ritualDepthUpgradedPayload } from './application/use-cases/ritual/brief/ritual-depth-upgrade-payload';
export {
  buildInitialEmotionLoggedPayload,
  initialEmotionLogDedupeKey,
  initialEmotionSkippedLogDedupeKey,
  initialEmotionSkippedLoggedPayload,
  type InitialEmotionLogOpts,
} from './application/use-cases/ritual/feel/initial-emotion-log';
export { initialEmotionResetUi } from './application/use-cases/ritual/feel/run-initial-emotion-log';
export type { InitialEmotionUiState } from './application/use-cases/ritual/feel/run-initial-emotion-log';
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
