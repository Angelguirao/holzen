/**
 * CI cluster anchor for ritual reflect mood — Feel-step initial_emotion_logged RPC (§3 / check:architecture-alignment).
 * Use cases live in `run-initial-emotion-log`; re-export for presentation I/O imports.
 */
export {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from './run-initial-emotion-log';
export type {
  RunInitialEmotionSelectResult,
  RunInitialEmotionSkipResult,
} from './run-initial-emotion-log';
