/**
 * CI cluster marker for `application/use-cases/ritual/reflect/pending-offer/` (§3 / check:architecture-alignment).
 * RPC adopt/decline + display + PostHog: `pause-reflect-pending-offer-flow` composes leaf modules;
 * subcluster flow anchors remain CI-only. Presentation parity: `presentation/reflect/pending-offer/pause-reflect-pending-offer-io-parity.test.ts`
 * (display + run-* + repository binding + `pauseAdoptPendingOffer` / `pauseDeclinePendingOffer` wrappers),
 * `presentation/reflect/pending-offer/pause-reflect-pending-offer-telemetry-io-parity.test.ts`
 * (beside `pause-pending-offer-telemetry-flow` in this cluster).
 */
export {};
