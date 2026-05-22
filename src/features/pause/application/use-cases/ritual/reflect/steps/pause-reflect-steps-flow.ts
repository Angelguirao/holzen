/**
 * CI cluster anchor for ritual reflect steps presentation I/O (§3 / check:architecture-alignment).
 * Composes domain step gates + run-* leaf use cases (not steps subcluster flow anchors).
 * Re-export parity: pause-reflect-steps-io.re-exports.test.ts may import this anchor (CI exempt).
 * Wrapper delegation: pause-reflect-steps-io-parity.test.ts (presentation I/O → run-* leaves).
 * Sibling pins: pause-reflect-steps-flow.test.ts (umbrella vs steps subcluster flow anchors);
 * pause-reflect-steps-flow.test.ts ↔ pause-reflect-flows-flow.test.ts;
 * pause-reflect-steps-hub-flow-sibling-parity.test.ts pins separation from pause-reflect-hub-flow.
 */
export { runPauseFavoriteToggle } from './run-pause-favorite-toggle';
export { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';
export { runPauseReflectNoteUpdate } from './run-pause-reflect-note-update';
export { runPauseReflectTagUpdate } from './run-pause-reflect-tag-update';
export { runPauseReflectionStepLogOnce } from './run-pause-reflection-step-log';
export { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';
