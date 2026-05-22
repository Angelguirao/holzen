/**
 * CI cluster anchor for ritual reflect pending-offer presentation I/O (§3 / check:architecture-alignment).
 * Composes RPC, display, and PostHog subcluster anchors.
 * Presentation: `pause-reflect-pending-offer-io.ts` and `pause-reflect-pending-offer-telemetry-io.ts` import through this anchor.
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
