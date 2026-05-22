/**
 * CI cluster anchor for holzen-reflect hook helpers (§3 / check:architecture-alignment).
 * Pure helpers live in sibling leaf modules; re-export for application hook-flow anchor.
 */
export {
  resolveReflectGenerationPrefetch,
  type ReflectGenerationPrefetch,
} from './resolve-reflect-generation-prefetch';
export {
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from './reflect-generation-run-guards';
export { messageFromReflectGenerationResult } from './message-from-reflect-generation-result';
