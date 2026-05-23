/**
 * CI cluster anchor for ritual reflect generation hook helpers (§3 / check:architecture-alignment).
 * Pure prefetch/commit/clear helpers live in domain; re-export for application-layer imports.
 * Presentation: `pause-reflect-generation-io.ts` imports domain helpers + `run-reflect-generation` directly (CI cluster anchor only).
 * Sibling parity: `pause-reflect-generation-hook-flow-sibling-parity.test.ts` ↔ `pause-reflect-generation-flow`;
 * presentation parity: `pause-reflect-generation-hook-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`
 * (presentation + application sibling parity tests);
 * inline pins: `pause-reflect-generation-hook-flow.test.ts`, `pause-reflect-generation-flow.test.ts`.
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
