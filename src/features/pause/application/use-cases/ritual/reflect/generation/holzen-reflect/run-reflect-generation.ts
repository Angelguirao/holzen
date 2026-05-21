import { buildReflectGenerationEdgeInvokeInput } from '@/features/pause/domain/reflect/generation/reflect-generation-edge-params';
import type { ReflectGenerationProfileInput } from '@/features/pause/domain/reflect/generation/reflect-generation-edge-params';
import { isAbortLikeReflectError } from '@/features/pause/domain/reflect/generation/reflect-generation-errors';
import type { ReflectGenerationResult } from '@/features/pause/domain/reflect/generation/reflect-generation-result';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';

export type RunReflectGenerationInput = {
  pauseInstanceId: string;
  userId: string;
  context: string;
  initialReflectionMessage: string;
  severityAbsPct: number;
  profile: ReflectGenerationProfileInput;
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
    return { status: 'seed', message: seed };
  }

  const cached = await generator.fetchReflectionText(input.pauseInstanceId);
  if (cached) {
    return { status: 'cached', message: cached };
  }

  try {
    const edgeInput = buildReflectGenerationEdgeInvokeInput({
      pauseInstanceId: input.pauseInstanceId,
      userId: input.userId,
      context: input.context.trim(),
      severityAbsPct: input.severityAbsPct,
      profile: input.profile,
      signal: input.signal,
    });
    const recencyHints = await generator.loadRecencyHints();
    const { message } = await generator.generateReflection(edgeInput, recencyHints);
    return { status: 'generated', message };
  } catch (e: unknown) {
    if (isAbortLikeReflectError(e) || input.signal.aborted) {
      return { status: 'aborted' };
    }
    throw e;
  }
}
