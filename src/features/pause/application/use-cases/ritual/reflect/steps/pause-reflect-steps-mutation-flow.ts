/**
 * CI cluster anchor for ritual reflect steps — post-it + favorite + reflection_step RPC (§3 / check:architecture-alignment).
 * Use cases live in sibling `run-*` modules; re-export for presentation I/O imports.
 */
export { runPauseFavoriteToggle } from './run-pause-favorite-toggle';
export { runPauseReflectNoteUpdate } from './run-pause-reflect-note-update';
export { runPauseReflectTagUpdate } from './run-pause-reflect-tag-update';
export { runPauseReflectionStepLogOnce } from './run-pause-reflection-step-log';
