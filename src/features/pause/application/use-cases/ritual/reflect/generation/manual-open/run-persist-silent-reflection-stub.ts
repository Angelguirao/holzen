import { reflectionPersistErrorMessage } from '@/features/pause/domain/pause-persist-error';
import type {
  PersistSilentReflectionStubInput,
  PersistSilentReflectionStubResult,
} from '@/features/pause/domain/reflect/generation/persist-silent-reflection-stub-types';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';

export type {
  PersistSilentReflectionStubInput,
  PersistSilentReflectionStubResult,
} from '@/features/pause/domain/reflect/generation/persist-silent-reflection-stub-types';

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
