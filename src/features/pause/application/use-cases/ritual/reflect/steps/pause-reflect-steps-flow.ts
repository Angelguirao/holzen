/**
 * CI cluster anchor for ritual reflect steps presentation I/O (§3 / check:architecture-alignment).
 * Composes steps subcluster anchors; presentation imports via `pause-reflect-steps-io.ts`.
 */
export { runPauseFavoriteToggle, shouldShowFavoriteProHint } from './pause-favorite-toggle-flow';
export { runPauseReflectNoteUpdate } from './pause-reflect-note-flow';
export { runPauseReflectTagUpdate } from './pause-reflect-tag-flow';
export {
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
} from './pause-reflection-step-log-flow';
