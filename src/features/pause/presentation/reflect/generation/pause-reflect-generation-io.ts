import {
  runReflectGeneration,
  type RunReflectGenerationInput,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-run-flow';
import {
  messageFromReflectGenerationResult,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
  type ReflectGenerationPrefetch,
} from '@/features/pause/domain/reflect/generation/reflect-generation-hook-flow';
import { reflectGenerationPrerequisite } from '@/features/pause/domain/reflect/generation/reflect-generation-prerequisites';
import { reflectGenerationUserErrorMessage } from '@/features/pause/domain/reflect/generation/reflect-generation-errors';
import { resolveEffectiveReflectionCopy } from '@/features/pause/domain/reflect/generation/resolve-effective-reflection-copy';

export {
  messageFromReflectGenerationResult,
  reflectGenerationPrerequisite,
  reflectGenerationUserErrorMessage,
  resolveEffectiveReflectionCopy,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
  type ReflectGenerationPrefetch,
};
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';
import { supabaseReflectGenerator } from '@/features/pause/public-rpc';

export type { RunReflectGenerationInput };

/** Default holzen-reflect + artifact port for reflect generation presentation hooks. */
export const reflectGenerator = supabaseReflectGenerator;

/** Nav seed → artifact cache → edge `holzen-reflect` (bound default generator). */
export function pauseReflectGeneration(
  input: RunReflectGenerationInput,
  generator: ReflectGenerator = reflectGenerator,
): ReturnType<typeof runReflectGeneration> {
  return runReflectGeneration(input, generator);
}
