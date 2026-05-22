/**
 * CI cluster anchor for pending pause offer display copy (§3).
 * Pure projection: `pending-pause-offer-display.ts`.
 * Sibling pins: `pause-reflect-pending-offer-flow-display-flow-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-flow`;
 * `pause-reflect-pending-offer-rpc-flow-display-flow-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-rpc-flow`;
 * `pause-reflect-pending-offer-flow-telemetry-flow-sibling-parity.test.ts` ↔ `pause-pending-offer-telemetry-flow`;
 * `pause-pending-offer-display-flow.test.ts` + `pause-reflect-pending-offer-flow.test.ts` (inline sibling pins).
 */
export {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
  type PendingPauseOfferDisplayInput,
} from './pending-pause-offer-display';
