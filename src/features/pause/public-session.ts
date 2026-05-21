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
export { buildPauseSessionScaffoldRitualDerived } from './application/use-cases/session/scaffold-ritual-derived';
export {
  computePauseStorageRitualSyncPatch,
  type PauseStorageRitualSyncPatch,
} from './application/use-cases/session/storage-ritual-sync';
