import { runPersistSilentReflectionStub } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-persist-silent-reflection-stub';
import type {
  RunOpenManualPauseSilentModeAfterCreateInput,
  RunOpenManualPauseSilentModeAfterCreateResult,
} from '@/features/pause/domain/reflect/generation/open-manual-pause-silent-mode-after-create-types';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';

export type {
  RunOpenManualPauseSilentModeAfterCreateError,
  RunOpenManualPauseSilentModeAfterCreateInput,
  RunOpenManualPauseSilentModeAfterCreateOpened,
  RunOpenManualPauseSilentModeAfterCreateResult,
} from '@/features/pause/domain/reflect/generation/open-manual-pause-silent-mode-after-create-types';

/** Home silent-mode: persist reflection stub after `pause_create_or_reuse`, then return opened payload. */
export async function runOpenManualPauseSilentModeAfterCreate(
  reflect: ReflectGenerator,
  input: RunOpenManualPauseSilentModeAfterCreateInput,
): Promise<RunOpenManualPauseSilentModeAfterCreateResult> {
  const persistResult = await runPersistSilentReflectionStub(reflect, {
    pauseInstanceId: input.pauseInstanceId,
    userId: input.userId,
    context: input.contextText,
    message: input.silentMessage,
  });
  if (persistResult.outcome === 'error') {
    return {
      outcome: 'error',
      userMessage: persistResult.userMessage,
      isNetwork: false,
    };
  }
  return {
    outcome: 'opened',
    instanceId: input.pauseInstanceId,
    context: input.contextText,
    pendingOffer: input.pendingOffer,
    created: input.created,
    silentStubPersisted: true,
  };
}
