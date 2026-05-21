/**
 * Reflect share presentation I/O — plain-text/channel builders (domain) + PNG orchestration (application).
 * Imports builders and orchestration via `pause-reflect-share-flow` CI anchor
 * (parity with `pause-reflect-steps-io` → steps flow).
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
