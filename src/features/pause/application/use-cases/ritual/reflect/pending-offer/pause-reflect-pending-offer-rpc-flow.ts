/**
 * CI cluster anchor for ritual reflect pending-offer RPC + display (§3).
 * Adopt/decline use cases and pending-offer display helpers for presentation I/O.
 */
export { runAdoptPendingPauseOffer } from './run-adopt-pending-pause-offer';
export { runDeclinePendingPauseOffer } from './run-decline-pending-pause-offer';
export {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
  type PendingPauseOfferDisplayInput,
} from './pending-pause-offer-display';
