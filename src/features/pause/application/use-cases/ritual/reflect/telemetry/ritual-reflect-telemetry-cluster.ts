/**
 * CI cluster marker for `application/use-cases/ritual/reflect/telemetry/` (§3 / check:architecture-alignment).
 * PostHog flow anchors colocate with tracker modules:
 * - Home manual-open: `generation/manual-open/pause-home-reflect-telemetry-flow`
 * - Session reflect UI: `share/pause-reflect-telemetry-flow`
 * - Pending pause offer + session abandoned: `pause-pending-offer-telemetry-flow` (session telemetry I/O)
 */
export {};
