/**
 * CI cluster marker for `application/use-cases/ritual/reflect/pending-offer/` (§3 / check:architecture-alignment).
 * RPC adopt/decline + display + PostHog: `pause-reflect-pending-offer-flow` composes leaf modules;
 * subcluster flow anchors remain CI-only. Presentation parity: `pause-reflect-pending-offer-io-parity.test.ts`,
 * `pause-reflect-pending-offer-telemetry-io-parity.test.ts` (beside `telemetry/pause-pending-offer-telemetry-flow`).
 */
export {};
