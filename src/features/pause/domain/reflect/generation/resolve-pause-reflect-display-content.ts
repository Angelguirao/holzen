import type { TFunction } from 'i18next';
import { buildReflectClientFallback } from '@/features/pause/domain/reflect/generation/build-reflect-client-fallback';
import {
  reflectionContentFromLegacyMessage,
  type CurrentFeelForReflect,
  type ReflectionContentV2,
} from '@/features/pause/domain/reflect/generation/reflection-content-v2';

export type ResolvePauseReflectDisplayContentInput = {
  reflectionContent: ReflectionContentV2 | null;
  reflectionMessage: string;
  reflectionError: string | null;
  context: string | null | undefined;
  severityAbsPct: number;
  currentFeel?: CurrentFeelForReflect;
  t: TFunction;
};

/** Copy shown in Reflect blocks (live, cached, legacy message, or client fallback on edge failure). */
export function resolvePauseReflectDisplayContent(
  input: ResolvePauseReflectDisplayContentInput,
): ReflectionContentV2 | null {
  if (input.reflectionError && input.context?.trim()) {
    return buildReflectClientFallback({
      context: input.context.trim(),
      severityAbsPct: input.severityAbsPct,
      currentFeel: input.currentFeel,
      land: input.t('pause.reflect.fallbackLand', {
        defaultValue:
          'This moment can feel loud. You do not need to decide anything right now — just notice what is here.',
      }),
    });
  }
  if (input.reflectionContent) return input.reflectionContent;
  if (input.reflectionMessage.trim()) {
    return reflectionContentFromLegacyMessage(input.reflectionMessage);
  }
  return null;
}
