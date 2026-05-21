import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { showPauseStepSyncFailedToast } from '@/features/pause/application/use-cases/ritual/step-sync-toast';
import { resolveShiftFrameHubDonePresentation } from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';
import { logPauseShiftEmotionFrameHubDone } from '@/features/pause/public-rpc';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';

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
      await logPauseShiftEmotionFrameHubDone({
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
