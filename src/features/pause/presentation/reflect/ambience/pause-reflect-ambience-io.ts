/**
 * Reflect/Frame focus-bed presentation I/O.
 * Imports Web Audio helpers from domain directly (parity with
 * `pause-reflect-generation-io` → domain + run-reflect-generation; not ambience-flow umbrella).
 * Sibling parity: `pause-reflect-ambience-generation-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`;
 * `pause-reflect-ambience-hub-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io`;
 * `pause-reflect-flows-ambience-io-sibling-parity.test.ts` ↔ `pause-reflect-flows-io`;
 * `pause-reflect-ambience-mood-io-sibling-parity.test.ts` ↔ `pause-reflect-mood-io`;
 * `pause-reflect-ambience-share-io-sibling-parity.test.ts` + `share/pause-reflect-share-ambience-io-sibling-parity.test.ts` ↔ `pause-reflect-share-io`;
 * `pause-reflect-ambience-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-io`;
<<<<<<< HEAD
 * reciprocal inline pins on `pause-reflect-ambience-io.test.ts` ↔ `pause-reflect-pending-offer-io.test.ts`;
 * inline pins: `pause-reflect-ambience-io.test.ts`, `pause-reflect-generation-io.test.ts`, `pause-reflect-flows-io.test.ts`.
=======
 * `pause-reflect-ambience-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-telemetry-io`;
 * reciprocal inline pins: `pause-reflect-ambience-io.test.ts` ↔ `pause-reflect-pending-offer-io.test.ts`;
 * inline pins: `pause-reflect-ambience-io.test.ts`, `pause-reflect-generation-io.test.ts`, `pause-reflect-flows-io.test.ts`, `pause-reflect-telemetry-io.test.ts`.
>>>>>>> 5b814440e (test(pause): add presentation ambience-io ↔ telemetry-io sibling parity)
 */
export {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';
