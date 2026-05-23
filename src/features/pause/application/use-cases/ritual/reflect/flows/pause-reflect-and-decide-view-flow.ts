/**
 * CI cluster anchor for ritual reflect+decide — preflight/post-generation view (§3).
 * Pure helpers live in domain; re-export for application-layer imports.
 */
export {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  type PauseSessionReflectAndDecideViewInput,
} from '@/features/pause/domain/reflect/flows/pause-session-reflect-and-decide-flow';
