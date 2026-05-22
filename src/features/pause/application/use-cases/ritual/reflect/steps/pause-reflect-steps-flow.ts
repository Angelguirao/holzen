/**
 * CI cluster anchor for ritual reflect steps presentation I/O (§3 / check:architecture-alignment).
 * Composes domain step gates + run-* leaf use cases (not steps subcluster flow anchors).
 * Re-export parity: pause-reflect-steps-io.re-exports.test.ts may import this anchor (CI exempt).
 * Wrapper delegation: pause-reflect-steps-io-parity.test.ts (presentation I/O → run-* leaves).
 * Sibling pins: pause-reflect-steps-flow.test.ts (umbrella vs steps subcluster flow anchors);
 * pause-reflect-steps-flow.test.ts ↔ pause-reflect-flows-flow.test.ts (inline);
 * pause-reflect-steps-flow.test.ts ↔ pause-reflect-pending-offer-flow.test.ts (inline sibling pins incl. declined telemetry);
 * pause-reflect-steps-flow.test.ts ↔ pause-reflect-telemetry-flow.test.ts (inline);
 * pause-reflect-steps-hub-flow-sibling-parity.test.ts, pause-reflect-steps-mood-flow-sibling-parity.test.ts,
 * pause-reflect-steps-pending-offer-flow-sibling-parity.test.ts, pause-reflect-steps-share-flow-sibling-parity.test.ts,
 * pause-reflect-steps-telemetry-flow-sibling-parity.test.ts,
 * pause-reflect-steps-generation-flow-sibling-parity.test.ts, pause-reflect-note-tag-flow-sibling-parity.test.ts (note/tag subcluster anchors), and
 * pause-reflect-steps-flows-flow-sibling-parity.test.ts pin separation from hub/mood/pending-offer/share/telemetry/generation/flows CI anchors.
 */
export { runPauseFavoriteToggle } from './run-pause-favorite-toggle';
export { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';
export { runPauseReflectNoteUpdate } from './run-pause-reflect-note-update';
export { runPauseReflectTagUpdate } from './run-pause-reflect-tag-update';
export { runPauseReflectionStepLogOnce } from './run-pause-reflection-step-log';
export { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';
