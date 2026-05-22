/**
 * Session pending-offer PostHog helpers.
 * Imports trackers via `pause-session-pending-offer-flow` CI anchor.
 */
export {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from '@/features/pause/application/use-cases/session/pause-session-pending-offer-flow';
