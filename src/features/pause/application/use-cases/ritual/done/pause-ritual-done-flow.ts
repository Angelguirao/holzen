/**
 * CI cluster anchor for ritual done presentation I/O (§3 / check:architecture-alignment).
 * Composes done subcluster anchors; presentation imports via `pause-ritual-done-io.ts` (leaf use case re-exported for parity tests).
 */
export {
  runPostPauseEmotionLogIfDirty,
  type PostPauseFeelSnapshot,
  type RunPostPauseEmotionLogResult,
} from './pause-post-pause-emotion-log-flow';
