import {
  messageFromReflectGenerationResult,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/reflect-generation-hook-flow';
import {
  runReflectGeneration,
  type RunReflectGenerationInput,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/run-reflect-generation';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';
import { supabaseReflectGenerator } from '@/features/pause/public-rpc';

export type { RunReflectGenerationInput };

export {
  messageFromReflectGenerationResult,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
};

/** Default holzen-reflect + artifact port for reflect generation presentation hooks. */
export const reflectGenerator = supabaseReflectGenerator;

/** Nav seed → artifact cache → edge `holzen-reflect` (bound default generator). */
export function pauseReflectGeneration(
  input: RunReflectGenerationInput,
  generator: ReflectGenerator = reflectGenerator,
): ReturnType<typeof runReflectGeneration> {
  return runReflectGeneration(input, generator);
}
