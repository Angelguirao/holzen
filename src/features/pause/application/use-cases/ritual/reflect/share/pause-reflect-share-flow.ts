/**
 * CI cluster anchor for ritual reflect share presentation I/O (§3 / check:architecture-alignment).
 * Composes share orchestration + session reflect UI PostHog subclusters.
 * Presentation: `pause-reflect-share-io.ts` and `pause-reflect-telemetry-io.ts` import through this anchor.
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
} from './pause-reflect-telemetry-flow';
