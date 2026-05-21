/**
 * CI cluster anchor for ritual reflect generation hook helpers (§3 / check:architecture-alignment).
 * Pure prefetch/commit/clear helpers live in domain; re-export for application-layer imports.
 * Presentation: `pause-reflect-generation-io.ts` imports through this anchor (off deep domain/run-* paths).
 */
export {
  messageFromReflectGenerationResult,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
  type ReflectGenerationPrefetch,
} from '@/features/pause/domain/reflect/generation/reflect-generation-hook-flow';
export { reflectGenerationPrerequisite } from '@/features/pause/domain/reflect/generation/reflect-generation-prerequisites';
export { reflectGenerationUserErrorMessage } from '@/features/pause/domain/reflect/generation/reflect-generation-errors';
export { resolveEffectiveReflectionCopy } from '@/features/pause/domain/reflect/generation/resolve-effective-reflection-copy';
export {
  runReflectGeneration,
  type RunReflectGenerationInput,
} from './run-reflect-generation';
