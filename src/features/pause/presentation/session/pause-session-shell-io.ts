/**
 * Presentation I/O for `/pause` shell chrome (hydration, header back, mount log, shell VM).
 * Imports session shell use cases via `pause-session-shell-flow` CI anchor
 * (parity with `pause-session-scaffold-io` → scaffold flow).
 */
export {
  buildPauseSessionMountLogParams,
  buildPauseSessionStepTransitionConfig,
  coalescePauseSessionShellViewModel,
  computePauseHeaderBackIntent,
  computePauseSessionHydration,
  computePauseSessionResolved,
  isPauseSessionHeaderBackVisible,
  pauseStepSwipeDirection,
  type PauseHeaderBackIntent,
  type PauseHeaderBackIntentInput,
  type PauseSessionHeaderBackInput,
  type PauseSessionHydrationReady,
  type PauseSessionHydrationState,
  type PauseSessionMountLogParams,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
  hasPersistedPauseSessionPayload,
  isPauseSessionWaitingForInstanceFetch,
} from '@/features/pause/application/use-cases/session/pause-session-shell-flow';
