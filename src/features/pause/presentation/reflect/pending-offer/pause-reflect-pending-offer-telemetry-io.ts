/**
 * Pending-offer PostHog helpers (reflect presentation cluster).
 * Imports trackers via `pause-pending-offer-telemetry-flow` (parity with hub/steps I/O peels).
 */
export {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-telemetry-flow';
