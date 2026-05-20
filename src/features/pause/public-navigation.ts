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
