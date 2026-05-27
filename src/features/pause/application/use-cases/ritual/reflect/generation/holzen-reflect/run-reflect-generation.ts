import { buildReflectGenerationEdgeInvokeInput } from '@/features/pause/domain/reflect/generation/reflect-generation-edge-params';
import type {
  CurrentFeelForReflect,
  ReflectGenerationProfileInput,
} from '@/features/pause/domain/reflect/generation/reflect-generation-edge-params';
import { isAbortLikeReflectError } from '@/features/pause/domain/reflect/generation/reflect-generation-errors';
import { reflectionContentFromLegacyMessage } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import type { ReflectGenerationResult } from '@/features/pause/domain/reflect/generation/reflect-generation-result';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';

export type RunReflectGenerationInput = {
  pauseInstanceId: string;
  userId: string;
  context: string;
  initialReflectionMessage: string;
  severityAbsPct: number;
  profile: ReflectGenerationProfileInput;
  currentFeel?: CurrentFeelForReflect;
  signal: AbortSignal;
};

/**
 * Reflect-step copy: nav seed → artifact cache → edge `holzen-reflect`.
 * Hook owns React state, abort validity, and i18n for missing context.
 */
export async function runReflectGeneration(
  input: RunReflectGenerationInput,
  generator: ReflectGenerator,
): Promise<ReflectGenerationResult> {
  const seed = input.initialReflectionMessage.trim();
  if (seed) {
    const content = reflectionContentFromLegacyMessage(seed);
    return { status: 'seed', message: seed, content };
  }

  const cachedContent = await generator.fetchReflectionContent(input.pauseInstanceId);
  if (cachedContent) {
    return { status: 'cached', message: cachedContent.message, content: cachedContent };
  }

  try {
    const edgeInput = buildReflectGenerationEdgeInvokeInput({
      pauseInstanceId: input.pauseInstanceId,
      userId: input.userId,
      context: input.context.trim(),
      severityAbsPct: input.severityAbsPct,
      profile: input.profile,
      currentFeel: input.currentFeel,
      signal: input.signal,
    });
    const recencyHints = await generator.loadRecencyHints();
    const { message, content } = await generator.generateReflection(edgeInput, recencyHints);
    return { status: 'generated', message, content };
  } catch (e: unknown) {
    if (isAbortLikeReflectError(e) || input.signal.aborted) {
      return { status: 'aborted' };
    }
    throw e;
  }
}
