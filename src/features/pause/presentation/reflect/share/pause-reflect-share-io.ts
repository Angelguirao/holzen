/**
 * Reflect share presentation I/O — plain-text/channel builders (domain) + PNG orchestration (application).
 * Imports share subcluster flow anchors directly (parity with
 * `pause-reflect-steps-io` → steps subcluster flows).
 */
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-channel-urls-flow';
import {
  runReflectionShareImage,
  type DeliverReflectionShareImageDeps,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-image-flow';
import { buildReflectionShareText } from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-text-flow';

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
