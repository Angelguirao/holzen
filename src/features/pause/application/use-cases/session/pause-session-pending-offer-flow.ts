/**
 * CI cluster anchor for session pending-offer I/O (§3 / check:architecture-alignment).
 * Use cases live in sibling modules; re-export for presentation I/O imports.
 */
export { runAdoptPendingPauseOffer } from './pending-offer/run-adopt-pending-pause-offer';
export { runDeclinePendingPauseOffer } from './pending-offer/run-decline-pending-pause-offer';
