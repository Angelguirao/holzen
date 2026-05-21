/**
 * CI cluster anchor for ritual reflect steps presentation I/O (§3 / check:architecture-alignment).
 * Re-exports mutation use cases and domain step gates for a single presentation import surface.
 */
export { runPauseFavoriteToggle } from './run-pause-favorite-toggle';
export { runPauseReflectNoteUpdate } from './run-pause-reflect-note-update';
export { runPauseReflectTagUpdate } from './run-pause-reflect-tag-update';
export { runPauseReflectionStepLogOnce } from './run-pause-reflection-step-log';
export { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';
export { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';
