/**
 * Reflect share presentation I/O — plain-text/channel builders (domain) + PNG orchestration (application).
 * Imports through `pause-reflect-share-flow` (parity with hub/steps presentation I/O anchors).
 */
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  runReflectionShareImage,
  type DeliverReflectionShareImageDeps,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow';

export {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
};

/** Branded PNG render + native share or download (browser APIs). */
export function pauseReflectionShareImage(
  message: string,
  context: string | null | undefined,
  haiku: string | null | undefined,
  deps?: DeliverReflectionShareImageDeps,
): ReturnType<typeof runReflectionShareImage> {
  return runReflectionShareImage(message, context, haiku, deps);
}
