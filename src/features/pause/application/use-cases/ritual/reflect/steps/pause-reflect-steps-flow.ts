/**
 * CI cluster anchor for ritual reflect steps presentation I/O (§3 / check:architecture-alignment).
 * Composes domain step gates + run-* leaf use cases (not steps subcluster flow anchors).
 * Re-export parity: pause-reflect-steps-io.re-exports.test.ts may import this anchor (CI exempt).
 * Wrapper delegation: `pause-reflect-steps-io-parity.test.ts` (presentation I/O → run-* leaves);
 * application mirror: colocated `pause-reflect-steps-io-parity.test.ts` (umbrella + sibling pins + default/*WithRepository delegation).
 * Sibling pins: pause-reflect-steps-flow.test.ts (umbrella vs steps subcluster flow anchors);
 * pause-reflect-steps-flow.test.ts ↔ pause-reflect-flows-flow.test.ts (reciprocal inline pins);
 * pause-reflect-steps-flow.test.ts ↔ pause-reflect-pending-offer-flow.test.ts (inline sibling pins incl. declined telemetry);
 * pause-reflect-steps-flow.test.ts ↔ pause-reflect-telemetry-flow.test.ts (inline);
 * pause-reflect-steps-hub-flow-sibling-parity.test.ts,
 * pause-reflect-steps-hub-io-sibling-parity.test.ts (presentation steps-io ↔ hub-io),
 * pause-reflect-steps-mood-flow-sibling-parity.test.ts,
 * pause-reflect-steps-pending-offer-flow-sibling-parity.test.ts, pause-reflect-steps-share-flow-sibling-parity.test.ts,
 * pause-reflect-steps-telemetry-flow-sibling-parity.test.ts,
 * pause-reflect-steps-generation-flow-sibling-parity.test.ts (dedicated + reciprocal inline pins in `pause-reflect-steps-flow.test.ts` ↔ `pause-reflect-generation-flow.test.ts`),
 * pause-reflect-steps-generation-io-sibling-parity.test.ts (steps-io ↔ generation-io; application + presentation; reciprocal inline pins in `pause-reflect-steps-io-parity.test.ts` ↔ `pause-reflect-generation-io-parity.test.ts`),
 * pause-reflect-steps-ambience-flow-sibling-parity.test.ts (dedicated + reciprocal inline pins in `pause-reflect-steps-flow.test.ts` ↔ `pause-reflect-ambience-flow.test.ts`),
 * pause-reflect-steps-ambience-io-sibling-parity.test.ts (steps-io ↔ ambience-io; application + presentation; reciprocal inline pins in `pause-reflect-steps-io-parity.test.ts` / `pause-reflect-ambience-io-parity.test.ts`),
 * pause-reflect-note-tag-flow-sibling-parity.test.ts (note/tag subcluster anchors),
 * pause-reflect-steps-note-tag-flow-sibling-parity.test.ts (steps-flow ↔ note/tag; reciprocal inline pins in `pause-reflect-steps-flow.test.ts` ↔ `pause-reflect-note-flow.test.ts` / `pause-reflect-tag-flow.test.ts`),
 * pause-favorite-toggle-reflection-step-log-flow-sibling-parity.test.ts (favorite ↔ reflection_step log subcluster anchors),
 * pause-reflect-steps-favorite-reflection-step-log-flow-sibling-parity.test.ts (steps-flow ↔ favorite/reflection_step log; reciprocal inline pins in `pause-reflect-steps-flow.test.ts` ↔ `pause-favorite-toggle-flow.test.ts` / `pause-reflection-step-log-flow.test.ts`), and
 * pause-reflect-steps-flows-flow-sibling-parity.test.ts,
 * pause-reflect-steps-flows-io-sibling-parity.test.ts (application + presentation; steps-io ↔ flows-io),
 * pause-reflect-flows-steps-io-sibling-parity.test.ts (flows-colocated mirror) pin separation from hub/mood/pending-offer/share/telemetry/generation/flows CI anchors;
 * reciprocal inline pins: `pause-reflect-steps-flow.test.ts` ↔ `pause-reflect-generation-flow.test.ts` (holzen-reflect + manual-open off steps umbrella).
 * `pause-reflect-steps-flow-io-wrapper-sibling-parity.test.ts` ↔ `pause-reflect-steps-io` (presentation wrappers off flow umbrella).
 * Cross-surface: `pause-session-step-handlers-steps-flow-sibling-parity.test.ts` ↔ `session/pause-session-step-handlers-flow`
 * (presentation mirror: `pause-session-step-handlers-steps-io-sibling-parity.test.ts`).
 */
export { runPauseFavoriteToggle } from './run-pause-favorite-toggle';
export { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';
export { runPauseReflectNoteUpdate } from './run-pause-reflect-note-update';
export { runPauseReflectTagUpdate } from './run-pause-reflect-tag-update';
export { runPauseReflectionStepLogOnce } from './run-pause-reflection-step-log';
export { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';
