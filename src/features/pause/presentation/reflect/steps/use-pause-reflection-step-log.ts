import { useEffect } from 'react';
import { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflection-step-log';
import { logPauseReflectionStepOnce } from '@/features/pause/public-rpc';

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
    void logPauseReflectionStepOnce(pauseInstanceId!).then(() => {
      if (cancelled) return;
      /* non-fatal — user can revisit Reflect to retry on sync_failed */
    });

    return () => {
      cancelled = true;
    };
  }, [pauseInstanceId, reflectionLoading, reflectionMessage, reflectionError]);
}
