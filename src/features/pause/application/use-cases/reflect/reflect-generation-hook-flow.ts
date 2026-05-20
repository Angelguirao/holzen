import type { ReflectGenerationPrerequisite } from '../ritual/reflect/generation-prerequisites';
import type { RunReflectGenerationResult } from '../ritual/reflect/run-reflect-generation';

export type ReflectGenerationPrefetch =
  | { kind: 'stop' }
  | { kind: 'missing_context' }
  | { kind: 'seed'; message: string }
  | { kind: 'generate' };

/** Early branches before starting a network generation run (hook-owned i18n for missing context). */
export function resolveReflectGenerationPrefetch(
  prereq: ReflectGenerationPrerequisite,
  initialReflectionMessage: string,
): ReflectGenerationPrefetch {
  if (prereq === 'idle') return { kind: 'stop' };
  if (prereq === 'missing_context') return { kind: 'missing_context' };
  const seed = initialReflectionMessage.trim();
  if (seed) return { kind: 'seed', message: seed };
  return { kind: 'generate' };
}

/** Stale async guard: only the run that captured this validity ticket may commit. */
export function shouldCommitReflectGeneration(validityTicket: number, currentValidity: number): boolean {
  return validityTicket === currentValidity;
}

/** Only the active run id may clear the loading flag in `finally`. */
export function shouldClearReflectGenerationLoading(runId: number, activeRunId: number): boolean {
  return activeRunId === runId;
}

export function messageFromReflectGenerationResult(
  result: RunReflectGenerationResult,
): string | null {
  if (result.status === 'aborted') return null;
  return result.message;
}
