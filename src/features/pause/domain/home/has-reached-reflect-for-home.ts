import { isSilentReflectionStubMessage } from '@/features/pause/domain/home/is-silent-reflection-stub-message';

export type HasReachedReflectForHomeInput = {
  hasReflectionStep: boolean;
  reflectionMessage: string | null;
  trackedAssetSymbol: string;
};

/** Preview copy after Reflect — uses `reflection_step` and non-stub `reflection_text`. */
export function hasReachedReflectForHome(input: HasReachedReflectForHomeInput): boolean {
  if (input.hasReflectionStep) return true;
  const msg = input.reflectionMessage?.trim() ?? '';
  if (!msg) return false;
  if (isSilentReflectionStubMessage(msg, input.trackedAssetSymbol)) return false;
  return true;
}
