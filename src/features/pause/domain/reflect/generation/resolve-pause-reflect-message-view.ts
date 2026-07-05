import { hasReflectDisplayCopy } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import type { ReflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';

export type PauseReflectMessageView = 'error' | 'loading' | 'body';

/** Which reflection message surface to show (parity with `PauseReflectCard` branches). */
export function resolvePauseReflectMessageView(input: {
  reflectionError: string | null;
  reflectionLoading: boolean;
  reflectionMessage: string;
  reflectionContent?: ReflectionContentV2 | null;
}): PauseReflectMessageView {
  if (input.reflectionError) return 'error';
  if (
    input.reflectionLoading &&
    !input.reflectionMessage.trim() &&
    !hasReflectDisplayCopy(input.reflectionContent)
  ) {
    return 'loading';
  }
  return 'body';
}
