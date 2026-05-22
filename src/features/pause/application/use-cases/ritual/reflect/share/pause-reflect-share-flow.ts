/**
 * CI cluster anchor for ritual reflect share presentation I/O (§3 / check:architecture-alignment).
 * Composes orchestration + session reflect UI PostHog subclusters.
 * Presentation: `pause-reflect-share-io.ts` → orchestration subcluster;
 * `pause-reflect-telemetry-io.ts` uses `pause-reflect-telemetry-flow`.
 */
export type { DeliverReflectionShareImageDeps } from './pause-reflect-share-orchestration-flow';
export { runReflectionShareImage } from './pause-reflect-share-orchestration-flow';
export { buildReflectionShareText } from './pause-reflect-share-orchestration-flow';
export {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from './pause-reflect-share-orchestration-flow';
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-telemetry-flow';
