/**
 * CI cluster anchor for ritual reflect flows (§3 / check:architecture-alignment).
 * Pure preflight/post-generation helpers live in domain; re-export for application-layer imports.
 */
export {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  type PauseSessionReflectAndDecideViewInput,
} from '@/features/pause/domain/reflect/flows/pause-session-reflect-and-decide-flow';
