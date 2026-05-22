/**
 * CI cluster anchor for pending pause offer + session-abandoned PostHog (§3 / check:architecture-alignment).
 * Trackers: `pending-pause-offer-telemetry.ts` (adopt/decline), `pause-session-abandoned-telemetry.ts`.
 * Session presentation: `pause-session-pending-offer-telemetry-io.ts` imports through this anchor only.
 */
export {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from './pending-pause-offer-telemetry';
export { trackPauseSessionAbandoned } from './pause-session-abandoned-telemetry';
