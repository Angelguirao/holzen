import type { ReflectGenerationResult } from '@/features/pause/domain/reflect/generation/reflect-generation-result';
import type { ReflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';

export function messageFromReflectGenerationResult(
  result: ReflectGenerationResult,
): string | null {
  if (result.status === 'aborted') return null;
  return result.message;
}

export function contentFromReflectGenerationResult(
  result: ReflectGenerationResult,
): ReflectionContentV2 | null {
  if (result.status === 'aborted') return null;
  return result.content;
}
