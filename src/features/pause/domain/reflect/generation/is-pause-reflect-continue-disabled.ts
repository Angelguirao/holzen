import { hasReflectDisplayCopy } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import type { ReflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';

/** Reflect-step Continue: allow skip after error or when copy exists; block only when there is nothing to show yet. */
export function isPauseReflectContinueDisabled(input: {
  reflectionError: string | null;
  reflectionMessage: string;
  reflectionContent?: ReflectionContentV2 | null;
}): boolean {
  if (input.reflectionError) return false;
  if (hasReflectDisplayCopy(input.reflectionContent)) return false;
  return input.reflectionMessage.trim().length === 0;
}
