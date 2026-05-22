/**
 * CI cluster anchor for pending pause offer adopt/decline + display (§3 / check:architecture-alignment).
 * Reflect presentation: `pause-reflect-pending-offer-io` imports through this anchor only.
 */
export { runAdoptPendingPauseOffer } from './run-adopt-pending-pause-offer';
export { runDeclinePendingPauseOffer } from './run-decline-pending-pause-offer';
export {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
  type PendingPauseOfferDisplayInput,
} from './pending-pause-offer-display';
