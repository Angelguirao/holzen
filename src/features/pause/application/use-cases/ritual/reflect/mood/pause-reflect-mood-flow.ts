/**
 * CI cluster anchor for ritual reflect mood presentation I/O (§3 / check:architecture-alignment).
 * Composes mood subcluster anchors; presentation imports via `pause-reflect-mood-io.ts`.
 */
export {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from './pause-initial-emotion-log-flow';
export type {
  RunInitialEmotionSelectResult,
  RunInitialEmotionSkipResult,
} from './pause-initial-emotion-log-flow';
export { buildFeelTilesMoodLogOptions } from './pause-feel-tiles-mood-flow';
export {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
  isPauseSessionDepthPickerActive,
  resolvePauseDepthContextLineParams,
} from './pause-depth-picker-mood-flow';
export {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  type InitialEmotionUiState,
} from './pause-initial-emotion-presentation-flow';
export {
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
  type PauseSessionChromeCloseAction,
  type PauseSessionPhase,
} from './pause-session-mood-chrome-flow';
