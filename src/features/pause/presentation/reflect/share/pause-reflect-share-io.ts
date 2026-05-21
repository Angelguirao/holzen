import { runReflectionShareImage } from '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image';
import type { DeliverReflectionShareImageDeps } from '@/features/pause/application/use-cases/ritual/reflect/share/deliver-reflection-share-image';

/** Branded PNG render + native share or download (browser APIs). */
export function pauseReflectionShareImage(
  message: string,
  context: string | null | undefined,
  haiku: string | null | undefined,
  deps?: DeliverReflectionShareImageDeps,
): ReturnType<typeof runReflectionShareImage> {
  return runReflectionShareImage(message, context, haiku, deps);
}
