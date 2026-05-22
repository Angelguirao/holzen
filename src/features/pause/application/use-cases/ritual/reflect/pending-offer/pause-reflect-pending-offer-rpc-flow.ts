/**
 * CI cluster anchor for ritual reflect pending-offer adopt/decline RPC (§3).
 * Use cases: `run-adopt-pending-pause-offer`, `run-decline-pending-pause-offer`.
 * Sibling pins: `pause-reflect-pending-offer-flow-rpc-flow-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-flow`;
 * `pause-reflect-pending-offer-rpc-flow.test.ts` + `pause-reflect-pending-offer-flow.test.ts` (inline sibling pins).
 */
export { runAdoptPendingPauseOffer } from './run-adopt-pending-pause-offer';
export { runDeclinePendingPauseOffer } from './run-decline-pending-pause-offer';
