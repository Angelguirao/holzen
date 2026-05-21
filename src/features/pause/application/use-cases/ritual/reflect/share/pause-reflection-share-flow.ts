/**
 * CI cluster anchor for ritual reflect share flows (§3 / check:architecture-alignment).
 * Pure share text + channel URL builders live in domain; re-export for application-layer imports.
 */
export { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';
export {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';
