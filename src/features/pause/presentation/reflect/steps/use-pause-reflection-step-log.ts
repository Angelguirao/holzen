import { useEffect } from 'react';
import { runPauseReflectionStepLogOnce } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log';
import { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';
import { reflectionStepSessionStorage } from '@/features/pause/infrastructure/edge/reflect/reflection-step-session-storage';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/** Records `reflection_step` once per pause instance after reflect copy settles. */
export function usePauseReflectionStepLog(input: {
  pauseInstanceId: string | null;
  reflectionLoading: boolean;
  reflectionMessage: string;
  reflectionError: string | null;
}): void {
  const { pauseInstanceId, reflectionLoading, reflectionMessage, reflectionError } = input;

  useEffect(() => {
    if (
      !shouldLogPauseReflectionStep({
        pauseInstanceId,
        reflectionLoading,
        reflectionMessage,
        reflectionError,
      })
    ) {
      return;
    }

    let cancelled = false;
    void runPauseReflectionStepLogOnce(
      supabasePauseRepository,
      { pauseInstanceId: pauseInstanceId! },
      { storage: reflectionStepSessionStorage },
    ).then(() => {
      if (cancelled) return;
      /* non-fatal — user can revisit Reflect to retry on sync_failed */
    });

    return () => {
      cancelled = true;
    };
  }, [pauseInstanceId, reflectionLoading, reflectionMessage, reflectionError]);
}
