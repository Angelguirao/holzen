/**
 * CI cluster anchor for ritual reflect generation hook helpers (§3 / check:architecture-alignment).
 * Pure prefetch/commit/clear helpers live in domain; re-export for application-layer imports.
 */
export {
  messageFromReflectGenerationResult,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
  type ReflectGenerationPrefetch,
} from '@/features/pause/domain/reflect/generation/reflect-generation-hook-flow';
