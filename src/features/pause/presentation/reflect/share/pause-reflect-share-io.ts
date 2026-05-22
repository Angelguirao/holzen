/**
 * Reflect share presentation I/O — plain-text/channel builders (domain) + PNG orchestration (application).
 * Imports domain builders and `run-reflection-share-image` directly (parity with
 * `pause-reflect-pending-offer-io` → leaf RPC/display modules).
 * Sibling parity: `pause-reflect-hub-share-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io`;
 * `pause-reflect-share-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-io`.
 */
import {
  runReflectionShareImage,
  type DeliverReflectionShareImageDeps,
} from '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';
import { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';

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
