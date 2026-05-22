/**
 * CI cluster anchor for pending pause offer PostHog (§3 / check:architecture-alignment).
 * Trackers live in sibling `pending-pause-offer-telemetry.ts` (adopt/decline).
 * Session presentation: `pause-session-pending-offer-telemetry-io.ts` imports through this anchor.
 */
export {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from './pending-pause-offer-telemetry';
