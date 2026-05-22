/**
 * Presentation I/O for `/pause` Holzen → session provider slice.
 * Imports `pause-holzen-providers-slice` directly (parity with step-handlers-io → step-bundles).
 * Parity pins: `pause-session-providers-io-parity.test.ts`, `pause-session-providers-io.test.ts`,
 * `pause-session-providers-scaffold-io-sibling-parity.test.ts` (↔ `pause-session-scaffold-io`);
 * `pause-session-providers-io.re-exports.test.ts` (inline scaffold-io distinctness).
 */
export {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
  type PickPauseHolzenProvidersSliceSource,
} from '@/features/pause/application/use-cases/session/pause-holzen-providers-slice';
