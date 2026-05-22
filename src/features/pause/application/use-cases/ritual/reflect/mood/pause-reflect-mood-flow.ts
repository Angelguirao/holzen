/**
 * CI cluster anchor for ritual reflect mood presentation I/O (§3 / check:architecture-alignment).
 * Re-exports mood helpers and run-* use cases for application-layer imports.
 * Presentation: `pause-reflect-mood-io.ts` imports via `pause-reflect-mood-flow`.
 */
export {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from './run-initial-emotion-log';
export {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '@/features/pause/domain/reflect/mood/apply-depth-picker-ritual-entry';
export { buildFeelTilesMoodLogOptions } from '@/features/pause/domain/reflect/mood/build-feel-tiles-mood-log-options';
export {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  type InitialEmotionUiState,
} from '@/features/pause/domain/reflect/mood/initial-emotion-presentation';
export {
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
  type PauseSessionChromeCloseAction,
  type PauseSessionPhase,
} from '@/features/pause/domain/reflect/mood/pause-session-mood-chrome-flow';
export { resolvePauseDepthContextLineParams } from '@/features/pause/domain/reflect/mood/resolve-pause-depth-context-line-params';
export { isPauseSessionDepthPickerActive } from '@/features/pause/domain/reflect/mood/pause-depth-picker-active';
