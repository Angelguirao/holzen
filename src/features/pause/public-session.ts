/**
 * Pause session shell pure helpers (no Supabase).
 * Presentation hooks import from here instead of deep `application/use-cases/session/*`.
 */
export {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
  type PauseHeaderBackIntent,
  type PauseHeaderBackIntentInput,
  type PauseSessionHeaderBackInput,
} from './application/use-cases/session/header-back';
export {
  buildPauseSessionMountLogParams,
  type BuildPauseSessionMountLogParamsInput,
  type PauseSessionMountLogParams,
} from './application/use-cases/session/mount-log-params';
export {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
} from './application/use-cases/session/step-transition';
export { pauseStepSwipeDirection } from './application/use-cases/session/step-swipe-direction';
export {
  buildPauseSessionPersistSnapshot,
  type PauseSessionPersistSnapshotInput,
} from './application/use-cases/session/persist-snapshot';
export {
  hasPersistablePauseSessionAnchor,
  hasPersistedPauseSessionPayload,
  type PersistedSessionAnchor,
} from './application/use-cases/session/persisted-session-guards';
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
} from './application/use-cases/session/hydration';
export {
  coalescePauseSessionShellViewModel,
  type PauseSessionShellViewModel,
} from './application/use-cases/session/shell-view-model';
export {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './application/use-cases/session/step-bundles';
export {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './application/use-cases/session/terminal-entry-guard';
export {
  buildPauseSessionScaffoldRitualDerived,
  type PauseSessionScaffoldRitualDerived,
} from './application/use-cases/session/scaffold-ritual-derived';
export {
  computePauseStorageRitualSyncPatch,
  type PauseStorageRitualSyncPatch,
} from './application/use-cases/session/storage-ritual-sync';
export {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
  type PickPauseHolzenProvidersSliceSource,
} from './application/use-cases/session/pause-holzen-providers-slice';
export { applyBreathSegmentLogOutcome } from './application/use-cases/ritual/breathe/run-breath-segment-log';
export { initialBreathSegmentRpcLoggedFlagsFromRestored } from './application/use-cases/ritual/breathe/initial-breath-segment-rpc-flags';
export {
  resolvePauseBreathSecondLabelVariant,
  viteWantsPauseBreathSecondLabelShift,
  type PauseBreathSecondLabelVariant,
} from './application/use-cases/ritual/breathe/breath-second-label-variant';
export type { PauseBreathingPhase } from './application/use-cases/ritual/breathe/pause-breathing-phase';
export {
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
  resolveBreathingPhaseAdvanceOutcome,
  type BreathingPhaseAdvanceOutcome,
  type BreathingPhaseAdvanceResult,
  type BreathingTimedLoopState,
} from './application/use-cases/ritual/breathe/phase-advance';
export {
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
  resumePauseAudioContext,
} from './application/use-cases/ritual/breathe/ritual-audio';
export type { PauseStep } from './domain/pause-ritual-steps';
export type { BriefPauseStep, RitualDepth } from './domain/ritual-types';
export {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialDecisionFromRestored,
  initialFrameDoneFromRestored,
  initialPhaseFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
  mapPersistedStep,
} from './application/use-cases/session/step-map';
export { getSessionQuote, type WisdomQuote } from './application/use-cases/ritual/decide/wisdom-quotes';
export {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
  type PauseDecideOutcomeFlow,
} from './application/use-cases/ritual/decide/pause-decide-outcome-flow';
