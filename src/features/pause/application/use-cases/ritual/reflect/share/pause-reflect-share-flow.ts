/**
 * CI cluster anchor for ritual reflect share presentation I/O (§3 / check:architecture-alignment).
 * Re-exports domain share builders and PNG orchestration for application-layer imports.
 * Presentation: `pause-reflect-share-io.ts` imports through this anchor (off deep domain and run-* paths).
 */
export type { DeliverReflectionShareImageDeps } from './deliver-reflection-share-image';
export { runReflectionShareImage } from './run-reflection-share-image';
export { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';
export {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';
