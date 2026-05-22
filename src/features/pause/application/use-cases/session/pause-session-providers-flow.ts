/**
 * CI cluster anchor for `/pause` Holzen → session provider slice (§3 / check:architecture-alignment).
 * Re-exports the picker used by `use-pause-session-providers-conductor`.
 * Presentation: `pause-session-providers-io.ts` imports through this anchor.
 */
export {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
  type PickPauseHolzenProvidersSliceSource,
} from './pause-holzen-providers-slice';
