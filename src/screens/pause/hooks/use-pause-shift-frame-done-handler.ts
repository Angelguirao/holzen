import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import { pauseLogStep } from '@/features/pause/public-rpc';
import { runShiftEmotionFrameHubDone } from '@/features/pause/public';
import { showPauseStepSyncFailedToast } from '@/features/pause/public';

const logShiftEmotionStep = (params: { instanceId: string; payload: Record<string, unknown> }) =>
  pauseLogStep({
    instanceId: params.instanceId,
    stepType: 'shift_emotion_logged',
    payload: params.payload,
  }).then(() => undefined);

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
    const outcome = await runShiftEmotionFrameHubDone(
      { pauseInstanceId, lastShiftLogKey: lastShiftLogKeyRef.current },
      { logStep: logShiftEmotionStep },
    );

    if (outcome.status === 'sync_failed') {
      showPauseStepSyncFailedToast(t);
      return;
    }

    lastShiftLogKeyRef.current = outcome.logKey;
    setFrameDone(true);
    setMoodAfterDone(true);
    goToStep('breath2');
  }, [pauseInstanceId, goToStep, t, lastShiftLogKeyRef, setFrameDone, setMoodAfterDone]);

  return { handleFrameImDone };
}
