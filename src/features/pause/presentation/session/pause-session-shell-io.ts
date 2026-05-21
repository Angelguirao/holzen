/**
 * Presentation I/O for `/pause` shell chrome (header back visibility + press intent).
 * Session breath navigation and header-back handlers import here instead of deep `application/use-cases/session/*`.
 */
export {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
  type PauseHeaderBackIntent,
  type PauseHeaderBackIntentInput,
  type PauseSessionHeaderBackInput,
} from '@/features/pause/application/use-cases/session/header-back';
