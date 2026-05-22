/**
 * Reflect/Frame focus-bed presentation I/O.
 * Imports Web Audio helpers from domain directly (parity with
 * `pause-reflect-generation-io` → domain + run-reflect-generation; not ambience-flow umbrella).
 * Sibling parity: `pause-reflect-ambience-generation-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`.
 */
export {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';
