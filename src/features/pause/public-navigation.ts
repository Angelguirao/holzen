/**
 * Pause session router state for cross-context deep links (notifications, etc.).
 * No Supabase — safe for notification UI without loading pause infrastructure.
 */
export {
  type NotificationNavigateState,
  type PauseSessionLocationState,
  type PauseSessionNavParsed,
  type PauseSeverity,
  parsePauseSessionLocationState,
} from './application/use-cases/session/location-state';
export {
  buildHomePauseSessionLocationState,
  type BuildHomePauseSessionLocationStateInput,
} from './application/use-cases/session/build-home-pause-session-location-state';
export { canNavigateToPauseSession } from './application/use-cases/session/can-navigate-to-pause-session';
export { shouldNavigateAfterManualTrigger } from './application/use-cases/ritual/reflect/generation/should-navigate-after-manual-trigger';
