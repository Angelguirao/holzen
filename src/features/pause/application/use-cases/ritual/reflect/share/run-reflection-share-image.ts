import { generateReflectionShareImage } from '@/features/pause/domain/reflect/share/reflection-share-canvas';
import {
  deliverReflectionShareImage,
  type DeliverReflectionShareImageDeps,
  type DeliverReflectionShareImageOutcome,
} from './deliver-reflection-share-image';

/** Branded PNG render + native share or download (browser APIs). */
export async function runReflectionShareImage(
  message: string,
  context: string | null | undefined,
  haiku: string | null | undefined,
  deps?: DeliverReflectionShareImageDeps,
): Promise<DeliverReflectionShareImageOutcome> {
  const blob = await generateReflectionShareImage(message, context, haiku);
  return deliverReflectionShareImage(blob, deps);
}
