/**
 * CI cluster anchor for ritual reflect hub presentation I/O (§3 / check:architecture-alignment).
 * Composes domain hub helpers + `run-shift-emotion-frame-hub-done` leaf use case (not subcluster flow anchors).
 * `pause-reflect-hub-io.re-exports.test.ts`, `pause-reflect-hub-io-parity.test.ts`, and
 * `pause-reflect-hub-mood-flow-sibling-parity.test.ts` and
 * `pause-reflect-steps-hub-flow-sibling-parity.test.ts` may import this umbrella for parity;
 * `pause-reflect-hub-flow.test.ts` pins sibling-cluster separation from `pause-reflect-mood-flow`
 * and `pause-reflect-steps-flow`.
 * Production hub I/O keeps leaf imports.
 */
export {
  resolveShiftFrameHubDonePresentation,
  type ShiftFrameHubDonePresentation,
} from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';
export { buildShiftEmotionFrameHubLogBundle } from '@/features/pause/domain/reflect/hub/shift-emotion-log';
export { runShiftEmotionFrameHubDone } from './run-shift-emotion-frame-hub-done';
