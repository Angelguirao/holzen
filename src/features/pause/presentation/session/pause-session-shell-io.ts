/**
 * Presentation I/O for `/pause` shell chrome (header back, mount log params, shell view model).
 * Session shell bootstrap, breath navigation, and header-back handlers import here instead of deep `application/use-cases/session/*`.
 */
export {
  buildPauseSessionMountLogParams,
  coalescePauseSessionShellViewModel,
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
  type PauseHeaderBackIntent,
  type PauseHeaderBackIntentInput,
  type PauseSessionHeaderBackInput,
  type PauseSessionMountLogParams,
} from '@/features/pause/application/use-cases/session/pause-session-shell-flow';
