/**
 * Holzen-reflect generation presentation I/O (bound ReflectGenerator port).
 * Imports domain hook leaf modules and `run-reflect-generation` directly (parity with
 * `pause-feel-io` leaf imports; not generation umbrella or hook-flow bundle).
 * Wrapper delegation pins: `pause-reflect-generation-io-parity.test.ts` (presentation, colocated) + `application/.../generation/pause-reflect-generation-io-parity.test.ts` (application CI anchor).
 * Sibling parity: `pause-reflect-generation-hub-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io`;
 * `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts` ↔ `pause-home-reflect-io` (colocated under `manual-open/`; presentation + application);
 * `pause-reflect-generation-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-telemetry-io` (presentation + application);
 * `pause-reflect-generation-feel-io-sibling-parity.test.ts` ↔ `pause-feel-io` (presentation + application);
 * `pause-reflect-generation-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-io`;
 * `pause-reflect-ambience-generation-io-sibling-parity.test.ts` ↔ `pause-reflect-ambience-io` (presentation + application);
 * `pause-reflect-flows-generation-io-sibling-parity.test.ts` ↔ `pause-reflect-flows-io` (application
 * `pause-reflect-flows-generation-io-sibling-parity.test.ts` under `application/.../flows/`; reciprocal inline pins in
 * `pause-reflect-generation-io-parity.test.ts` ↔ `pause-reflect-flows-io-parity.test.ts`);
 * `pause-reflect-steps-generation-io-sibling-parity.test.ts` ↔ `pause-reflect-steps-io`;
 * `pause-reflect-generation-share-io-sibling-parity.test.ts` ↔ `pause-reflect-share-io`;
 * `pause-reflect-generation-hook-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-hook-flow`;
 * application `pause-reflect-generation-hook-io-sibling-parity.test.ts` (cross-layer duplicate pins);
 * reciprocal inline pins: `pause-reflect-generation-io.test.ts` ↔ `pause-reflect-steps-io.test.ts`,
 * `pause-reflect-telemetry-io.test.ts`, ↔ `pause-home-reflect-io.test.ts`;
 * `pause-reflect-generation-io.re-exports.test.ts` ↔ `pause-reflect-telemetry-io.re-exports.test.ts`;
 * application flow umbrellas: `pause-reflect-generation-flow.test.ts` ↔ `pause-reflect-steps-flow.test.ts` (reciprocal inline).
 * Flow↔I/O wrapper: `pause-reflect-generation-flow-io-wrapper-sibling-parity.test.ts` (application + presentation;
 * colocated beside this module).
 * inline pins: `pause-reflect-generation-io.test.ts`, `pause-reflect-ambience-io.test.ts`.
 * `pause-reflect-generation-flow-io-wrapper-sibling-parity.test.ts` beside this module (flow umbrella vs port-bound wrappers; application mirror under `application/.../generation/`).
 */
import {
  runReflectGeneration,
  type RunReflectGenerationInput,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation';
import {
  contentFromReflectGenerationResult,
  messageFromReflectGenerationResult,
} from '@/features/pause/domain/reflect/generation/message-from-reflect-generation-result';
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
  contentFromReflectGenerationResult,
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
