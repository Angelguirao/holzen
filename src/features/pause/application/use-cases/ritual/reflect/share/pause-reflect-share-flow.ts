/**
 * CI cluster anchor for ritual reflect share presentation I/O (§3 / check:architecture-alignment).
 * Composes share orchestration + session reflect UI PostHog subclusters.
 * Presentation: `pause-reflect-share-io.ts` and `pause-reflect-telemetry-io.ts` import through this anchor.
 */
export type { DeliverReflectionShareImageDeps } from './pause-reflection-share-image-flow';
export { runReflectionShareImage } from './pause-reflection-share-image-flow';
export { buildReflectionShareText } from './pause-reflection-share-text-flow';
export {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from './pause-reflection-share-channel-urls-flow';
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-telemetry-flow';
