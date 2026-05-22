/**
 * Presentation I/O for `/pause` Holzen → session provider slice.
 * Imports `pause-holzen-providers-slice` directly (parity with step-handlers-io → step-bundles).
 */
export {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
  type PickPauseHolzenProvidersSliceSource,
} from '@/features/pause/application/use-cases/session/pause-holzen-providers-slice';
