/**
 * CI cluster anchor for `/pause` Holzen → session provider slice (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-providers-cluster.ts` (empty export; unit-tested).
 * Re-exports the picker from `pause-holzen-providers-slice`; presentation I/O imports the leaf module directly.
 * Parity: `pause-session-providers-io-parity.test.ts` and `pause-session-providers-io.re-exports.test.ts` pin presentation ↔ this anchor.
 * Sibling cluster: `pause-session-providers-shell-flow-sibling-parity.test.ts` ↔ `pause-session-shell-flow`.
 */
export {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
  type PickPauseHolzenProvidersSliceSource,
} from './pause-holzen-providers-slice';
