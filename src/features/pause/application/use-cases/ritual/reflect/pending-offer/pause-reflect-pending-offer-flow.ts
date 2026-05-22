/**
 * CI cluster anchor for ritual reflect pending-offer presentation I/O (§3 / check:architecture-alignment).
 * Composes adopt/decline RPC use cases, display projection, and PostHog leaf trackers
 * (not RPC/display/telemetry subcluster flow anchors).
 * Presentation: `pause-reflect-pending-offer-io.ts` and `presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io.ts`
 * import leaf modules directly. Parity pins: `pause-reflect-pending-offer-io-parity.test.ts` (display + run-* leaves +
 * `reflectPauseRepository` ↔ `supabasePauseRepository`; `pauseAdoptPendingOffer` / `pauseDeclinePendingOffer` delegation to
 * run-* with default repository — parity with hub-io), `pause-reflect-pending-offer-telemetry-io-parity.test.ts` (PostHog trackers).
 * Sibling cluster: `pause-reflect-steps-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-steps-flow`;
 * `pause-reflect-flows-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-flows-flow`;
 * `pause-reflect-pending-offer-flow.test.ts` ↔ `pause-reflect-steps-flow.test.ts` (inline sibling pins).
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
} from '../telemetry/pending-pause-offer-telemetry';
export { trackPauseSessionAbandoned } from '../telemetry/pause-session-abandoned-telemetry';
