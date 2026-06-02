import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import {
  pauseShiftEmotionFrameHubDone,
  resolveShiftFrameHubDonePresentation,
} from './pause-reflect-hub-io';
import { showPauseStepSyncFailedToast } from '@/features/pause/presentation/ritual/pause-step-sync-toast';
import type { MoodValue } from '@/features/pause/domain/mood-value';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';

/**
 * Frame hub “I'm done” → optional `shift_emotion_logged` RPC (deduped) then advance to second breath.
 */
export function usePauseShiftFrameDoneHandler(input: {
  pauseInstanceId: string | null;
  t: TFunction;
  lastShiftLogKeyRef: MutableRefObject<string | null>;
  frameShiftMood: MoodValue | null;
  frameShiftIntensity: number | null;
  setFrameDone: Dispatch<SetStateAction<boolean>>;
  setMoodAfterDone: Dispatch<SetStateAction<boolean>>;
  goToStep: (next: PauseStep) => void;
}): { handleFrameImDone: () => Promise<void> } {
  const {
    pauseInstanceId,
    t,
    lastShiftLogKeyRef,
    frameShiftMood,
    frameShiftIntensity,
    setFrameDone,
    setMoodAfterDone,
    goToStep,
  } = input;

  const handleFrameImDone = useCallback(async () => {
    const flow = resolveShiftFrameHubDonePresentation(
      await pauseShiftEmotionFrameHubDone({
        pauseInstanceId,
        lastShiftLogKey: lastShiftLogKeyRef.current,
        shiftMood: frameShiftMood,
        shiftIntensity: frameShiftIntensity,
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
  }, [
    pauseInstanceId,
    goToStep,
    t,
    lastShiftLogKeyRef,
    frameShiftMood,
    frameShiftIntensity,
    setFrameDone,
    setMoodAfterDone,
  ]);

  return { handleFrameImDone };
}
