/**
 * CI cluster anchor for ritual reflect pending-offer presentation I/O (§3 / check:architecture-alignment).
 * Composes adopt/decline RPC use cases, display projection, and PostHog leaf trackers
 * (not RPC/display/telemetry subcluster flow anchors).
 * Presentation: `pause-reflect-pending-offer-io.ts` and `presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io.ts`
 * import leaf modules directly. Parity pins: `pause-reflect-pending-offer-io-parity.test.ts` (application + presentation; display + run-* leaves +
 * `reflectPauseRepository` ↔ `supabasePauseRepository`; `pauseAdoptPendingOffer` / `pauseDeclinePendingOffer` delegation to
 * run-* with default repository — parity with hub-io), colocated `presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io-parity.test.ts` (PostHog trackers).
 * Sibling cluster: `pause-reflect-steps-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-steps-flow`;
 * `pause-reflect-flows-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-flows-flow`;
 * `pause-reflect-share-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-share-flow`;
 * `pause-reflect-generation-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-generation-flow`;
 * `pause-reflect-hub-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-hub-flow`;
 * `pause-reflect-mood-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-mood-flow`;
 * `pause-reflect-ambience-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-ambience-flow`;
 * `pause-reflect-pending-offer-flow.test.ts` ↔ `pause-reflect-steps-flow` + `pause-reflect-share-flow` + `pause-reflect-generation-flow` + `pause-reflect-hub-flow` + `pause-reflect-flows-flow` (inline sibling pins; presentation-io wrappers in dedicated sibling file below);
 * `pause-reflect-share-flow.test.ts` (inline share ↔ pending-offer pins);
 * `pause-reflect-pending-offer-flow-io-wrapper-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-io` (presentation wrappers off flow umbrella);
 * `pause-reflect-pending-offer-flow-rpc-flow-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-rpc-flow` (RPC-only subcluster vs presentation umbrella);
 * `pause-reflect-pending-offer-flow-display-flow-sibling-parity.test.ts` ↔ `pause-pending-offer-display-flow` (display-only subcluster vs presentation umbrella);
 * `pause-reflect-pending-offer-flow-telemetry-flow-sibling-parity.test.ts` ↔ `pause-pending-offer-telemetry-flow` (PostHog-only subcluster vs presentation umbrella).
 */
export { runAdoptPendingPauseOffer } from './run-adopt-pending-pause-offer';
export { runDeclinePendingPauseOffer } from './run-decline-pending-pause-offer';
export {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
  type PendingPauseOfferDisplayInput,
} from './pending-pause-offer-display';
export {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from './pending-pause-offer-telemetry';
export { trackPauseSessionAbandoned } from './pause-session-abandoned-telemetry';
