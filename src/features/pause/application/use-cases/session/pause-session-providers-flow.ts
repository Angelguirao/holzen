/**
 * CI cluster anchor for `/pause` Holzen → session provider slice (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-providers-cluster.ts` (empty export; unit-tested).
 * Re-exports the picker from `pause-holzen-providers-slice`; presentation I/O imports the leaf module directly.
 */
export {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
  type PickPauseHolzenProvidersSliceSource,
} from './pause-holzen-providers-slice';
