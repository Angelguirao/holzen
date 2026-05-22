/**
 * CI cluster anchor for ritual reflect ambience (§3 / check:architecture-alignment).
 * Web Audio bed implementation lives in domain; re-export for application-layer imports.
 * Sibling cluster anchor to `pause-reflect-generation-flow` (holzen-reflect + manual-open umbrella).
 * Presentation: `pause-reflect-ambience-io.ts` imports domain directly (not this anchor).
 * Parity: `pause-reflect-ambience-io-parity.test.ts` + `pause-reflect-ambience-io.re-exports.test.ts`;
 * sibling pin: `pause-reflect-ambience-flow.test.ts` ↔ `pause-reflect-generation-flow.test.ts`.
 */
export {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';
