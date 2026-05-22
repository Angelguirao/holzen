/**
 * CI cluster anchor for pending pause offer + session-abandoned PostHog (§3 / check:architecture-alignment).
 * Trackers: `pending-pause-offer-telemetry.ts` (adopt/decline), `pause-session-abandoned-telemetry.ts`.
 * Reflect presentation: `presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io.ts` imports leaf tracker modules from this cluster directly (not this anchor). Parity pins in `pause-reflect-pending-offer-telemetry-io.re-exports.test.ts` + `pause-reflect-pending-offer-telemetry-io-parity.test.ts`. Sibling cluster: `pause-pending-offer-telemetry-flow.test.ts` ↔ `pause-reflect-telemetry-flow.test.ts`.
 */
export {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from './pending-pause-offer-telemetry';
export { trackPauseSessionAbandoned } from './pause-session-abandoned-telemetry';
