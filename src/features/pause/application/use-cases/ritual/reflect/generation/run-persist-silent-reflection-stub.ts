import { reflectionPersistErrorMessage } from '@/features/pause/domain/pause-persist-error';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';

export type PersistSilentReflectionStubInput = {
  pauseInstanceId: string;
  userId: string;
  context: string;
  message: string;
};

export type PersistSilentReflectionStubResult =
  | { outcome: 'ok' }
  | { outcome: 'error'; userMessage: string };

/** Home silent-mode: persist reflection_text stub via ReflectGenerator port. */
export async function runPersistSilentReflectionStub(
  reflect: ReflectGenerator,
  input: PersistSilentReflectionStubInput,
): Promise<PersistSilentReflectionStubResult> {
  try {
    await reflect.persistReflectionArtifacts({
      pauseInstanceId: input.pauseInstanceId,
      userId: input.userId,
      context: input.context,
      message: input.message,
    });
    return { outcome: 'ok' };
  } catch (e: unknown) {
    return { outcome: 'error', userMessage: reflectionPersistErrorMessage(e) };
  }
}
