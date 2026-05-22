/**
 * CI cluster anchor for ritual done presentation I/O (§3 / check:architecture-alignment).
 * Use case: `runPostPauseEmotionLogIfDirty` (brief Done “Save to journey”).
 * Presentation: `pause-ritual-done-io.ts` imports through this anchor.
 */
export {
  runPostPauseEmotionLogIfDirty,
  type PostPauseFeelSnapshot,
  type RunPostPauseEmotionLogResult,
} from './post-pause-emotion-log';
