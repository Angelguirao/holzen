/**
 * CI cluster anchor for ritual reflect pending-offer presentation I/O (§3 / check:architecture-alignment).
 * Composes RPC, display, and PostHog subcluster anchors.
 * Presentation: `pause-reflect-pending-offer-io.ts` imports RPC/display leaf modules directly;
 * `pause-reflect-pending-offer-telemetry-io.ts` imports telemetry leaf modules directly.
 */
export {
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from './pause-reflect-pending-offer-rpc-flow';
export {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
  type PendingPauseOfferDisplayInput,
} from './pause-pending-offer-display-flow';
export {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-pending-offer-telemetry-flow';
