/**
 * `/pause` session shell — screen conductor, scaffold VM types, step motion tokens.
 */
export type { RitualDepth } from './domain/ritual-types';
export {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
} from './application/use-cases/session/step-transition';
export {
  usePauseSessionScreen,
  usePauseSessionScreenViewModel,
  type PauseSessionScreenViewModel,
} from './presentation/session/use-pause-session-screen';
export type { PauseBreathingHandle } from './presentation/session/breath/pause-breathing-handle';
export type {
  PauseSessionBriefRitualBodyProps,
  PauseSessionDeepRitualBodyProps,
} from './presentation/session/ritual-body-props';
export type {
  PauseScaffoldChromeRegistry,
  PauseSessionScaffoldVmChromeSlots,
  PauseSessionScaffoldVmProvidersSlice,
} from './presentation/session/scaffold/pause-session-scaffold-vm-types';
export { usePauseBriefIntegrateCountdown } from './presentation/session/use-pause-brief-integrate-countdown';
