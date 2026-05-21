import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { resolveShiftFrameHubDonePresentation } from '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-flow';
import { runShiftEmotionFrameHubDone } from '@/features/pause/public-rpc';
import { showPauseStepSyncFailedToast } from '@/features/pause/application/use-cases/ritual/step-sync-toast';
import type { PauseStep } from '@/features/pause/public-hooks';

/**
 * Frame hub “I'm done” → optional `shift_emotion_logged` RPC (deduped) then advance to second breath.
 */
export function usePauseShiftFrameDoneHandler(input: {
  pauseInstanceId: string | null;
  t: TFunction;
  lastShiftLogKeyRef: MutableRefObject<string | null>;
  setFrameDone: Dispatch<SetStateAction<boolean>>;
  setMoodAfterDone: Dispatch<SetStateAction<boolean>>;
  goToStep: (next: PauseStep) => void;
}): { handleFrameImDone: () => Promise<void> } {
  const { pauseInstanceId, t, lastShiftLogKeyRef, setFrameDone, setMoodAfterDone, goToStep } = input;

  const handleFrameImDone = useCallback(async () => {
    const flow = resolveShiftFrameHubDonePresentation(
      await runShiftEmotionFrameHubDone({
        pauseInstanceId,
        lastShiftLogKey: lastShiftLogKeyRef.current,
      }),
    );

    if (flow.kind === 'abort_sync_failed') {
      showPauseStepSyncFailedToast(t);
      return;
    }

    lastShiftLogKeyRef.current = flow.logKey;
    setFrameDone(true);
    setMoodAfterDone(true);
    goToStep(flow.nextStep);
  }, [pauseInstanceId, goToStep, t, lastShiftLogKeyRef, setFrameDone, setMoodAfterDone]);

  return { handleFrameImDone };
}
