/**
 * Reflect share presentation I/O — plain-text/channel builders (domain) + PNG orchestration (application).
 * Presentation imports here instead of application CI cluster anchors.
 */
import type { DeliverReflectionShareImageDeps } from '@/features/pause/application/use-cases/ritual/reflect/share/deliver-reflection-share-image';
import { runReflectionShareImage } from '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image';
import { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';

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
