import { runPersistSilentReflectionStub } from '@/features/pause/application/use-cases/ritual/reflect/generation/run-persist-silent-reflection-stub';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';

export type RunOpenManualPauseSilentModeAfterCreateInput = {
  pauseInstanceId: string;
  userId: string;
  contextText: string;
  silentMessage: string;
  pendingOffer: boolean;
  created: boolean;
};

export type RunOpenManualPauseSilentModeAfterCreateOpened = {
  outcome: 'opened';
  instanceId: string;
  context: string;
  pendingOffer: boolean;
  created: boolean;
  silentStubPersisted: true;
};

export type RunOpenManualPauseSilentModeAfterCreateError = {
  outcome: 'error';
  userMessage: string;
  isNetwork: false;
};

export type RunOpenManualPauseSilentModeAfterCreateResult =
  | RunOpenManualPauseSilentModeAfterCreateOpened
  | RunOpenManualPauseSilentModeAfterCreateError;

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
