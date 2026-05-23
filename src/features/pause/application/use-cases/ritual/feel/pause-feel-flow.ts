/**
 * CI cluster anchor for ritual reflect mood presentation I/O (§3 / check:architecture-alignment).
 * Composes domain mood helpers + `run-initial-emotion-log` leaf use case (not subcluster flow anchors).
 * Parity pins: `pause-feel-io-parity.test.ts` (application + presentation I/O ↔ umbrella + domain mood leaves + `reflectPauseRepository` ↔ `supabasePauseRepository`; application mirror pins RPC delegation + sibling-cluster distinctness), `pause-feel-io.re-exports.test.ts`, `pause-reflect-flows-feel-flow-sibling-parity.test.ts`, `pause-reflect-hub-feel-flow-sibling-parity.test.ts`, `pause-reflect-steps-feel-flow-sibling-parity.test.ts`, `pause-reflect-generation-feel-flow-sibling-parity.test.ts` (generation-flow ↔ mood-flow);
 * `pause-feel-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-flow`;
 * `pause-feel-hub-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io` (application; presentation
 * `pause-feel-hub-io-sibling-parity.test.ts`; complements `hub/pause-reflect-hub-feel-io-sibling-parity.test.ts`);
 * `pause-reflect-ambience-feel-flow-sibling-parity.test.ts` ↔ `pause-reflect-ambience-flow`;
 * `pause-reflect-share-feel-flow-sibling-parity.test.ts` ↔ `pause-reflect-share-flow`;
 * `pause-feel-flow.test.ts` pins sibling-cluster separation from `pause-reflect-hub-flow` and `pause-reflect-generation-flow`.
 * Flow↔I/O wrapper: `pause-feel-flow-io-wrapper-sibling-parity.test.ts` (application + presentation)
 * ↔ `pause-feel-io` (presentation wrappers off mood-flow CI umbrella; parity with steps/flows/share/generation).
 */
export {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from './run-initial-emotion-log';
export type {
  RunInitialEmotionSelectResult,
  RunInitialEmotionSkipResult,
} from './run-initial-emotion-log';
export { buildFeelTilesMoodLogOptions } from '@/features/pause/domain/feel/build-feel-tiles-mood-log-options';
export {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '@/features/pause/domain/feel/apply-depth-picker-ritual-entry';
export { isPauseSessionDepthPickerActive } from '@/features/pause/domain/feel/pause-depth-picker-active';
export { resolvePauseDepthContextLineParams } from '@/features/pause/domain/feel/resolve-pause-depth-context-line-params';
export {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  type InitialEmotionUiState,
} from '@/features/pause/domain/feel/initial-emotion-presentation';
export {
  resolvePauseSessionChromeCloseAction,
  runPauseSessionChromeCloseAction,
  type PauseSessionChromeCloseAction,
  type PauseSessionPhase,
} from '@/features/pause/domain/feel/pause-session-chrome-close';
export { runDeepPausePickerEntryIfPro } from '@/features/pause/domain/feel/run-deep-pause-picker-entry-if-pro';
