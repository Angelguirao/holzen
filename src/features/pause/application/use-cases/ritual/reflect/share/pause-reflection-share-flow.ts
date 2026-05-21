/**
 * CI cluster anchor for ritual reflect share flows (§3 / check:architecture-alignment).
 * Pure share text + channel URL builders live in domain; orchestration in sibling `run-*` modules.
 * Re-export for presentation I/O imports.
 */
export { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';
export {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';
export type { DeliverReflectionShareImageDeps } from './deliver-reflection-share-image';
export { runReflectionShareImage } from './run-reflection-share-image';
