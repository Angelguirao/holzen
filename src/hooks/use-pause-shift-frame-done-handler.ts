import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import { pauseLogStep } from '@/features/pause/public-rpc';
import { buildShiftEmotionFrameHubLogBundle } from '@/features/pause/public';
import { showPauseStepSyncFailedToast } from '@/features/pause/public';

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
    const { payload: shiftFramePayload, logKey } = buildShiftEmotionFrameHubLogBundle();
    if (pauseInstanceId) {
      if (lastShiftLogKeyRef.current !== logKey) {
        try {
          await pauseLogStep({
            instanceId: pauseInstanceId,
            stepType: 'shift_emotion_logged',
            payload: shiftFramePayload,
          });
          lastShiftLogKeyRef.current = logKey;
        } catch {
          showPauseStepSyncFailedToast(t);
          return;
        }
      }
    } else {
      lastShiftLogKeyRef.current = logKey;
    }
    setFrameDone(true);
    setMoodAfterDone(true);
    goToStep('breath2');
  }, [pauseInstanceId, goToStep, t, lastShiftLogKeyRef, setFrameDone, setMoodAfterDone]);

  return { handleFrameImDone };
}
