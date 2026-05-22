/**
 * CI cluster marker for `application/use-cases/ritual/reflect/telemetry/` (§3 / check:architecture-alignment).
 * PostHog flow anchors colocate with tracker modules:
 * - Home manual-open: `generation/manual-open/pause-home-reflect-telemetry-flow` (presentation via `presentation/reflect/telemetry/pause-home-reflect-telemetry-io` → leaf trackers)
 * - Session reflect UI: `telemetry/pause-reflect-telemetry-flow`
 * Pending pause offer + session abandoned PostHog: `pending-offer/pause-pending-offer-telemetry-flow` (leaf trackers colocated beside adopt/decline RPC use cases).
 */
export {};
