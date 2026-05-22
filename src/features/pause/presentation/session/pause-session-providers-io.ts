/**
 * Presentation I/O for `/pause` Holzen → session provider slice.
 * Imports `pause-holzen-providers-slice` directly (parity with step-handlers-io → step-bundles).
 * Parity pins: colocated `pause-session-providers-io-parity.test.ts` (presentation + application
 * `application/use-cases/session/pause-session-providers-io-parity.test.ts`), `pause-session-providers-io.test.ts`,
 * `pause-session-providers-scaffold-io-sibling-parity.test.ts` (↔ `pause-session-scaffold-io`; application
 * `pause-session-providers-scaffold-io-sibling-parity.test.ts` under `application/.../session/`; reciprocal inline pins in
 * `pause-session-providers-io-parity.test.ts` ↔ `pause-session-scaffold-io-parity.test.ts`),
 * `pause-session-providers-shell-io-sibling-parity.test.ts` (↔ `pause-session-shell-io`; application
 * `pause-session-providers-shell-io-sibling-parity.test.ts` under `application/.../session/`; reciprocal inline pins in
 * `pause-session-providers-io-parity.test.ts` ↔ `pause-session-shell-io-parity.test.ts`);
 * `pause-session-providers-io.re-exports.test.ts` (inline scaffold-io distinctness).
 */
export {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
  type PickPauseHolzenProvidersSliceSource,
} from '@/features/pause/application/use-cases/session/pause-holzen-providers-slice';
