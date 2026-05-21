/**
 * Pause session shell pure helpers (no Supabase).
 * Presentation hooks import from here instead of deep `application/use-cases/session/*`.
 */
export { pauseStepLayout } from './presentation/session/pause-step-layout';
export {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
  type PauseHeaderBackIntent,
  type PauseHeaderBackIntentInput,
  type PauseSessionHeaderBackInput,
} from './application/use-cases/session/header-back';
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
} from './application/use-cases/ritual/reflect/scaffold/persist-snapshot';
export {
  hasPersistablePauseSessionAnchor,
  hasPersistedPauseSessionPayload,
  type PersistedSessionAnchor,
} from './domain/session/persisted-session-guards';
export { isPauseSessionDepthPickerActive } from './domain/reflect/mood/pause-depth-picker-active';
export { isPauseSessionWaitingForInstanceFetch } from './domain/session/waiting-for-instance-fetch';
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
} from './application/use-cases/ritual/reflect/scaffold/scaffold-ritual-derived';
export {
  computePauseStorageRitualSyncPatch,
  type PauseStorageRitualSyncPatch,
} from './application/use-cases/ritual/reflect/scaffold/storage-ritual-sync';
export {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
  type PickPauseHolzenProvidersSliceSource,
} from './application/use-cases/session/pause-holzen-providers-slice';
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
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialSelectedBriefFaceFromRestored,
} from './application/use-cases/ritual/reflect/scaffold/restored-brief-ritual-state';
export {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
} from './application/use-cases/ritual/breathe/restored-breath-ritual-state';
export { initialFrameDoneFromRestored } from './application/use-cases/ritual/frame/restored-frame-ritual-state';
export {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from './application/use-cases/ritual/decide/restored-decide-ritual-state';
export { mapPersistedStep } from './domain/session/map-persisted-step';
export { initialRitualEntry } from './application/use-cases/ritual/reflect/scaffold/initial-ritual-entry';
export { getSessionQuote, type WisdomQuote } from './application/use-cases/ritual/decide/wisdom-quotes';
export {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
  type PauseDecideOutcomeFlow,
} from './application/use-cases/ritual/decide/pause-decide-outcome-flow';
export {
  clearSession,
  loadSession,
  saveSession,
} from './infrastructure/session/persisted-session-storage';
