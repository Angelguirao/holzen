/**
 * CI cluster anchor for ritual reflect share presentation I/O (§3 / check:architecture-alignment).
 * Composes domain share builders + `run-reflection-share-image` + session UI telemetry (not subcluster flow anchors).
 * Presentation: `pause-reflect-share-io.ts` imports share leaves directly; `presentation/reflect/telemetry/pause-reflect-telemetry-io.ts` imports session UI telemetry directly.
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
