/**
 * Presentation I/O for `/pause` shell chrome (header back, mount log params, shell view model).
 * Session shell bootstrap, breath navigation, and header-back handlers import here instead of deep `application/use-cases/session/*`.
 */
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
