/**
 * Presentation I/O for `/pause` shell chrome (hydration, header back, mount log, shell VM).
 * Imports session shell use cases directly instead of `pause-session-shell-flow` CI anchor.
 */
export {
  computePauseSessionHydration,
  computePauseSessionResolved,
  type PauseSessionHydrationReady,
  type PauseSessionHydrationState,
} from '@/features/pause/application/use-cases/session/hydration';
export {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
  type PauseHeaderBackIntent,
  type PauseHeaderBackIntentInput,
  type PauseSessionHeaderBackInput,
} from '@/features/pause/application/use-cases/session/header-back';
export {
  buildPauseSessionMountLogParams,
  type PauseSessionMountLogParams,
} from '@/features/pause/application/use-cases/session/mount-log-params';
export { coalescePauseSessionShellViewModel } from '@/features/pause/application/use-cases/session/shell-view-model';
export {
  buildPauseSessionStepTransitionConfig,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
} from '@/features/pause/application/use-cases/session/step-transition';
export { pauseStepSwipeDirection } from '@/features/pause/application/use-cases/session/step-swipe-direction';
