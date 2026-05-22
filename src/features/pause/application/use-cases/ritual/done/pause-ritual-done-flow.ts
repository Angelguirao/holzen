/**
 * CI cluster anchor for ritual done presentation I/O (§3 / check:architecture-alignment).
 * Composes done subcluster use cases; presentation imports via `pause-ritual-done-io.ts`.
 */
export {
  runPostPauseEmotionLogIfDirty,
  type PostPauseFeelSnapshot,
  type RunPostPauseEmotionLogResult,
} from './post-pause-emotion-log';
