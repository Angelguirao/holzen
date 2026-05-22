import type { ReflectGenerationResult } from '@/features/pause/domain/reflect/generation/reflect-generation-result';

export function messageFromReflectGenerationResult(
  result: ReflectGenerationResult,
): string | null {
  if (result.status === 'aborted') return null;
  return result.message;
}
