/**
 * CI cluster anchor for `/pause` Holzen → session provider slice (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-providers-cluster.ts` (empty export; unit-tested).
 * Re-exports the picker from `pause-holzen-providers-slice`; presentation I/O imports the leaf module directly.
 * Parity: colocated `presentation/session/pause-session-providers-io-parity.test.ts` and `pause-session-providers-io.re-exports.test.ts` pin presentation ↔ this anchor.
 * Sibling cluster: `pause-session-providers-shell-flow-sibling-parity.test.ts` ↔ `pause-session-shell-flow`;
 * `pause-session-providers-scaffold-flow-sibling-parity.test.ts` ↔ `pause-session-scaffold-flow`;
 * presentation + application `pause-session-providers-shell-io-sibling-parity.test.ts` / `pause-session-providers-scaffold-io-sibling-parity.test.ts`
 * ↔ shell-io / scaffold-io (reciprocal inline pins in providers-io / shell-io / scaffold-io parity tests).
 * Reciprocal pins: `pause-session-providers-flow.test.ts` ↔ `pause-session-scaffold-flow.test.ts`.
 */
export {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
  type PickPauseHolzenProvidersSliceSource,
} from './pause-holzen-providers-slice';
