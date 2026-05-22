/**
 * Pending-offer PostHog helpers (reflect presentation cluster).
 * Imports trackers via `pause-reflect-pending-offer-flow` CI anchor (composes telemetry subcluster).
 */
export {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
