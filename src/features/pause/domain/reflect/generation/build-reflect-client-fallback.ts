import type { CurrentFeelForReflect } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import { reflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import { buildReflectContextStripClient } from '@/features/pause/domain/reflect/generation/reflect-context-strip-client';
import { reflectInquiryFallbackTemplate } from '@/features/pause/domain/reflect/generation/reflect-inquiry-fallback-templates';

const DEFAULT_LAND =
  'This moment can feel loud. You do not need to decide anything right now — just notice what is here.';

/** Offline / edge-failure fallback — v2 fields rendered as integrated prose in the Reflect card. */
export function buildReflectClientFallback(input: {
  context: string;
  severityAbsPct: number;
  currentFeel?: CurrentFeelForReflect;
  land?: string;
}): ReturnType<typeof reflectionContentV2> {
  const mood = input.currentFeel?.mood ?? 'calm';
  return reflectionContentV2({
    land: input.land?.trim() || DEFAULT_LAND,
    hypothesis: '',
    inquiry: reflectInquiryFallbackTemplate(mood, input.context),
    contextStrip: buildReflectContextStripClient(input.context, input.severityAbsPct),
  });
}
