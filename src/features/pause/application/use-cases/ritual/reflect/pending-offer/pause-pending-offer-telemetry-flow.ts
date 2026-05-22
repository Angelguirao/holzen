/**
 * CI cluster anchor for pending pause offer + session-abandoned PostHog (§3 / check:architecture-alignment).
 * Trackers: `pending-pause-offer-telemetry.ts` (adopt/decline), `pause-session-abandoned-telemetry.ts`.
 * Reflect presentation: `presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io.ts` imports leaf tracker modules from `ritual/reflect/pending-offer/` directly (not this anchor). Parity pins: `pause-reflect-pending-offer-telemetry-io.re-exports.test.ts` (under `presentation/reflect/telemetry/`), `presentation/reflect/pending-offer/pause-reflect-pending-offer-telemetry-io-parity.test.ts` (colocated beside pending-offer-io), `pause-pending-offer-telemetry-flow.test.ts` (inline ↔ `pause-reflect-pending-offer-flow`), `pause-reflect-telemetry-pending-offer-flow-sibling-parity.test.ts` (colocated under pending-offer/; ↔ `pause-reflect-telemetry-flow`), `pause-reflect-pending-offer-flow-telemetry-flow-sibling-parity.test.ts` (↔ `pause-reflect-pending-offer-flow`).
 */
export {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from './pending-pause-offer-telemetry';
export { trackPauseSessionAbandoned } from './pause-session-abandoned-telemetry';
