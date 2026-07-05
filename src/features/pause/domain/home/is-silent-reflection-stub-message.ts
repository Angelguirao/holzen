import { buildSilentReflectionStubMessage } from '@/features/pause/domain/reflect/generation/build-silent-reflection-stub-message';

/** True when `reflection_text` is the Home silent-mode stub, not holzen-reflect output. */
export function isSilentReflectionStubMessage(
  message: string,
  trackedAssetSymbol: string,
): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  return trimmed === buildSilentReflectionStubMessage(trackedAssetSymbol);
}
