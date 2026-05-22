/**
 * CI cluster anchor for ritual reflect hub presentation I/O (§3 / check:architecture-alignment).
 * Composes domain hub helpers + `run-shift-emotion-frame-hub-done` leaf use case (not subcluster flow anchors).
 * `presentation/reflect/hub/pause-reflect-hub-io.re-exports.test.ts`,
 * `presentation/reflect/hub/pause-reflect-hub-io-parity.test.ts`,
 * `application/.../hub/pause-reflect-hub-io-parity.test.ts` (colocated), and
 * `pause-reflect-hub-mood-flow-sibling-parity.test.ts`,
 * `pause-reflect-hub-pending-offer-flow-sibling-parity.test.ts` (hub-flow ↔ pending-offer-flow),
 * `pause-reflect-share-hub-flow-sibling-parity.test.ts` + `pause-reflect-hub-share-flow-sibling-parity.test.ts` (share-flow ↔ hub-flow),
 * `pause-reflect-hub-share-io-sibling-parity.test.ts` (hub-io ↔ share-io presentation I/O; application mirror of presentation sibling),
 * `pause-reflect-hub-mood-io-sibling-parity.test.ts` (hub-io ↔ mood-io presentation I/O; complements mood-anchored
 * `mood/pause-reflect-mood-hub-io-sibling-parity.test.ts` and presentation `pause-reflect-mood-hub-io-sibling-parity.test.ts`),
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
