import { buildReflectGenerationEdgeInvokeInput } from '@/features/pause/domain/reflect-generation-edge-params';
import type {
  ReflectGenerationEdgeInvokeInput,
  ReflectGenerationProfileInput,
} from '@/features/pause/domain/reflect-generation-edge-params';
import { isAbortLikeReflectError } from '@/features/pause/domain/reflect-generation-errors';

export type RunReflectGenerationInput = {
  pauseInstanceId: string;
  userId: string;
  context: string;
  initialReflectionMessage: string;
  severityAbsPct: number;
  profile: ReflectGenerationProfileInput;
  signal: AbortSignal;
};

export type RunReflectGenerationPorts = {
  fetchReflectionText: (pauseInstanceId: string) => Promise<string | null>;
  generateReflection: (params: ReflectGenerationEdgeInvokeInput) => Promise<{ message: string }>;
};

export type RunReflectGenerationResult =
  | { status: 'seed'; message: string }
  | { status: 'cached'; message: string }
  | { status: 'generated'; message: string }
  | { status: 'aborted' };

/**
 * Reflect-step copy: nav seed → artifact cache → edge `holzen-reflect`.
 * Hook owns React state, abort validity, and i18n for missing context.
 */
export async function runReflectGeneration(
  input: RunReflectGenerationInput,
  ports: RunReflectGenerationPorts,
): Promise<RunReflectGenerationResult> {
  const seed = input.initialReflectionMessage.trim();
  if (seed) {
    return { status: 'seed', message: seed };
  }

  const cached = await ports.fetchReflectionText(input.pauseInstanceId);
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
    const { message } = await ports.generateReflection(edgeInput);
    return { status: 'generated', message };
  } catch (e: unknown) {
    if (isAbortLikeReflectError(e) || input.signal.aborted) {
      return { status: 'aborted' };
    }
    throw e;
  }
}
