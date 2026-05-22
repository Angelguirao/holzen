/**
 * CI cluster anchor for ritual reflect hub presentation I/O (§3 / check:architecture-alignment).
 * Composes domain hub helpers + `run-shift-emotion-frame-hub-done` leaf use case (not subcluster flow anchors).
 * `pause-reflect-hub-io.re-exports.test.ts`, `presentation/reflect/hub/pause-reflect-hub-io-parity.test.ts`, and
 * `pause-reflect-hub-mood-flow-sibling-parity.test.ts`,
 * `pause-reflect-hub-pending-offer-flow-sibling-parity.test.ts` (hub-flow ↔ pending-offer-flow),
 * `pause-reflect-share-hub-flow-sibling-parity.test.ts` + `pause-reflect-hub-share-flow-sibling-parity.test.ts` (share-flow ↔ hub-flow),
 * `pause-reflect-steps-hub-flow-sibling-parity.test.ts`,
 * `pause-reflect-steps-hub-io-sibling-parity.test.ts` (application + presentation steps-io ↔ hub-io), and
 * `pause-reflect-flows-hub-flow-sibling-parity.test.ts` may import this umbrella for parity;
 * `pause-reflect-generation-hub-flow-sibling-parity.test.ts` (generation-flow ↔ hub-flow);
 * `pause-reflect-hub-flow.test.ts` pins sibling-cluster separation from `pause-reflect-mood-flow`,
 * `pause-reflect-pending-offer-flow`, `pause-reflect-steps-flow`, `pause-reflect-share-flow`,
 * and `pause-reflect-generation-flow`.
 * Production hub I/O keeps leaf imports.
 */
export {
  resolveShiftFrameHubDonePresentation,
  type ShiftFrameHubDonePresentation,
} from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';
export { buildShiftEmotionFrameHubLogBundle } from '@/features/pause/domain/reflect/hub/shift-emotion-log';
export { runShiftEmotionFrameHubDone } from './run-shift-emotion-frame-hub-done';
