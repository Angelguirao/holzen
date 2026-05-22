/**
 * Holzen-reflect generation presentation I/O (bound ReflectGenerator port).
 * Imports domain hook leaf modules and `run-reflect-generation` directly (parity with
 * `pause-reflect-mood-io` leaf imports; not generation umbrella or hook-flow bundle).
 * Wrapper delegation pins: pause-reflect-generation-io-parity.test.ts (default generator + injected port).
 * Sibling parity: `pause-reflect-generation-hub-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io`;
 * `pause-reflect-generation-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-telemetry-io`;
 * `pause-reflect-generation-mood-io-sibling-parity.test.ts` ↔ `pause-reflect-mood-io`.
 */
import {
  runReflectGeneration,
  type RunReflectGenerationInput,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation';
import { messageFromReflectGenerationResult } from '@/features/pause/domain/reflect/generation/message-from-reflect-generation-result';
import {
  resolveReflectGenerationPrefetch,
  type ReflectGenerationPrefetch,
} from '@/features/pause/domain/reflect/generation/resolve-reflect-generation-prefetch';
import {
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from '@/features/pause/domain/reflect/generation/reflect-generation-run-guards';
import { reflectGenerationPrerequisite } from '@/features/pause/domain/reflect/generation/reflect-generation-prerequisites';
import { reflectGenerationUserErrorMessage } from '@/features/pause/domain/reflect/generation/reflect-generation-errors';
import { resolveEffectiveReflectionCopy } from '@/features/pause/domain/reflect/generation/resolve-effective-reflection-copy';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';
import { supabaseReflectGenerator } from '@/features/pause/public-rpc';

export {
  messageFromReflectGenerationResult,
  reflectGenerationPrerequisite,
  reflectGenerationUserErrorMessage,
  resolveEffectiveReflectionCopy,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
  type ReflectGenerationPrefetch,
  type RunReflectGenerationInput,
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
