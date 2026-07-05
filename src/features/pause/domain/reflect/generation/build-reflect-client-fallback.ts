import type { CurrentFeelForReflect } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import { reflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import {
  composeReflectFallbackOneVoice,
  reflectHypothesisFallbackTemplate,
  reflectInquiryFallbackTemplate,
  reflectLandFallbackTemplate,
} from '@/features/pause/domain/reflect/generation/reflect-inquiry-fallback-templates';

/** Offline / edge-failure fallback — v2 fields + one-voice message (Reflect v7 spirit). */
export function buildReflectClientFallback(input: {
  context: string;
  severityAbsPct: number;
  currentFeel?: CurrentFeelForReflect;
  land?: string;
}): ReturnType<typeof reflectionContentV2> {
  const mood = input.currentFeel?.mood ?? 'calm';
  const context = input.context.trim();
  const land = input.land?.trim() || reflectLandFallbackTemplate(mood, context);
  const hypothesis = reflectHypothesisFallbackTemplate(mood, context);
  const inquiry = reflectInquiryFallbackTemplate(mood, context);
  return reflectionContentV2({
    land,
    hypothesis,
    inquiry,
    contextStrip: null,
    integratedMessage: composeReflectFallbackOneVoice(land, hypothesis, inquiry),
  });
}
