/**
 * CI cluster anchor for ritual reflect share orchestration (§3 / check:architecture-alignment).
 * Composes domain share builders + `run-reflection-share-image` + `deliver-reflection-share-image` leaf modules
 * (not share subcluster flow anchors).
 * Presentation: `pause-reflect-share-io.ts` imports `run-reflection-share-image` directly (not this anchor).
 * Parity pins: `presentation/reflect/share/pause-reflect-share-io-parity.test.ts` + `pause-reflect-share-io.re-exports.test.ts`;
 * `pause-reflect-share-orchestration-flow-sibling-parity.test.ts` ↔ `pause-reflect-share-flow`;
 * presentation parity: colocated `pause-reflect-share-io-parity.test.ts` (share-io ↔ orchestration-flow + deliver leaf).
 * `pause-reflect-share-flow.test.ts` + `pause-reflect-share-orchestration-flow.test.ts` (inline sibling pins).
 */
export type {
  DeliverReflectionShareImageDeps,
  DeliverReflectionShareImageOutcome,
} from './deliver-reflection-share-image';
export {
  deliverReflectionShareImage,
} from './deliver-reflection-share-image';
export { runReflectionShareImage } from './run-reflection-share-image';
export { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';
export {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';
