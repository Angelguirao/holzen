/**
 * CI cluster anchor for ritual reflect mood presentation I/O (§3 / check:architecture-alignment).
 * Composes domain mood helpers + `run-initial-emotion-log` leaf use case (not subcluster flow anchors).
 * Parity pins: `pause-reflect-mood-io-parity.test.ts` (presentation I/O ↔ umbrella + domain mood leaves + `reflectPauseRepository` ↔ `supabasePauseRepository`), `pause-reflect-mood-io.re-exports.test.ts`, `pause-reflect-hub-mood-flow-sibling-parity.test.ts`;
 * `pause-reflect-mood-flow.test.ts` pins sibling-cluster separation from `pause-reflect-hub-flow`.
 */
export {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from './run-initial-emotion-log';
export type {
  RunInitialEmotionSelectResult,
  RunInitialEmotionSkipResult,
} from './run-initial-emotion-log';
export { buildFeelTilesMoodLogOptions } from '@/features/pause/domain/reflect/mood/build-feel-tiles-mood-log-options';
export {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '@/features/pause/domain/reflect/mood/apply-depth-picker-ritual-entry';
export { isPauseSessionDepthPickerActive } from '@/features/pause/domain/reflect/mood/pause-depth-picker-active';
export { resolvePauseDepthContextLineParams } from '@/features/pause/domain/reflect/mood/resolve-pause-depth-context-line-params';
export {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  type InitialEmotionUiState,
} from '@/features/pause/domain/reflect/mood/initial-emotion-presentation';
export {
  resolvePauseSessionChromeCloseAction,
  runPauseSessionChromeCloseAction,
  type PauseSessionChromeCloseAction,
  type PauseSessionPhase,
} from '@/features/pause/domain/reflect/mood/pause-session-chrome-close';
export { runDeepPausePickerEntryIfPro } from '@/features/pause/domain/reflect/mood/run-deep-pause-picker-entry-if-pro';
