/**
 * CI cluster anchor for session shell chrome (§3 / check:architecture-alignment).
 * Use cases live in sibling modules; re-export for presentation I/O imports.
 */
export {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
  type PauseHeaderBackIntent,
  type PauseHeaderBackIntentInput,
  type PauseSessionHeaderBackInput,
} from './header-back';
export {
  buildPauseSessionMountLogParams,
  type PauseSessionMountLogParams,
} from './mount-log-params';
export { coalescePauseSessionShellViewModel } from './shell-view-model';
