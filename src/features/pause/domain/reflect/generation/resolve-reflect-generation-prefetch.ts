import type { ReflectGenerationPrerequisite } from '@/features/pause/domain/reflect/generation/reflect-generation-prerequisites';

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
