/**
 * CI cluster anchor for ritual reflect share presentation I/O (§3 / check:architecture-alignment).
 * Composes domain share builders + `run-reflection-share-image` + session UI telemetry (not subcluster flow anchors).
 * Presentation: `pause-reflect-share-io.ts` imports share leaves directly; `presentation/reflect/telemetry/pause-reflect-telemetry-io.ts` imports session UI telemetry directly.
 * Sibling cluster: `pause-reflect-share-flow.test.ts` ↔ `pause-reflect-telemetry-flow.test.ts` (inline telemetry + pending-offer pins);
 * `pause-reflect-share-telemetry-flow-sibling-parity.test.ts` ↔ `pause-reflect-telemetry-flow`;
 * `pause-reflect-share-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-flow`;
 * `pause-reflect-flows-share-flow-sibling-parity.test.ts` ↔ `pause-reflect-flows-flow`;
 * `pause-reflect-steps-share-flow-sibling-parity.test.ts` ↔ `pause-reflect-steps-flow`.
 */
export type { DeliverReflectionShareImageDeps } from './deliver-reflection-share-image';
export { runReflectionShareImage } from './run-reflection-share-image';
export { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';
export {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '../telemetry/pause-reflect-session-ui-telemetry';
