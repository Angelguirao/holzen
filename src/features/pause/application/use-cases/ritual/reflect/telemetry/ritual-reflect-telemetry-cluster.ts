/**
 * CI cluster marker for `application/use-cases/ritual/reflect/telemetry/` (§3 / check:architecture-alignment).
 * PostHog flow anchors colocate with tracker modules:
 * - Home manual-open: `generation/manual-open/pause-home-reflect-telemetry-flow` (CI anchor; leaf trackers in same folder); presentation I/O in `presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io`; application parity/sibling pins colocated under `telemetry/` beside `pause-reflect-telemetry-io-parity.test.ts`
 * - Session reflect UI: `telemetry/pause-reflect-telemetry-flow`
 * Pending pause offer + session abandoned PostHog: `pending-offer/pause-pending-offer-telemetry-flow` (leaf trackers under `pending-offer/`; application + presentation `pause-reflect-pending-offer-telemetry-io-parity` colocated under `telemetry/`).
 */
export {};
