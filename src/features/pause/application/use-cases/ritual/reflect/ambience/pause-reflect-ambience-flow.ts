/**
 * CI cluster anchor for ritual reflect ambience (§3 / check:architecture-alignment).
 * Web Audio bed implementation lives in domain; re-export for application-layer imports.
 * Sibling cluster anchor to `pause-reflect-generation-flow` (holzen-reflect + manual-open umbrella).
 * Presentation: `pause-reflect-ambience-io.ts` imports domain directly (not this anchor).
 * Parity: `pause-reflect-ambience-io-parity.test.ts` + `pause-reflect-ambience-io.re-exports.test.ts`;
 * sibling pins: `pause-reflect-ambience-flow.test.ts` ↔ `pause-reflect-generation-flow.test.ts`
 * and `pause-reflect-flows-flow.test.ts`;
 * `pause-reflect-ambience-generation-flow-sibling-parity.test.ts` (ambience-flow ↔ generation-flow);
 * `pause-reflect-flows-ambience-flow-sibling-parity.test.ts` (ambience-flow ↔ flows-flow);
 * `pause-reflect-ambience-mood-flow-sibling-parity.test.ts` (ambience-flow ↔ mood-flow).
 */
export {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';
