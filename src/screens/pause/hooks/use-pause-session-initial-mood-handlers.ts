import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { MoodValue } from '@/screens/pause/components/MoodCheck';
import type { FeelStepTile } from '@/screens/pause/components/pause-feel-types';
import { hapticFeedback } from '@/lib/haptics';
import { pauseLogStep } from '@/features/pause/public-rpc';
import {
  initialEmotionResetUi,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
  type InitialEmotionUiState,
} from '@/features/pause/public';
import { showPauseStepSyncFailedToast } from '@/features/pause/public';

const logInitialEmotionStep = (params: {
  instanceId: string;
  payload: Record<string, unknown>;
}) =>
  pauseLogStep({
    instanceId: params.instanceId,
    stepType: 'initial_emotion_logged',
    payload: params.payload,
  }).then(() => undefined);

export function usePauseSessionInitialMoodHandlers(input: {
  pauseInstanceId: string | null;
  t: TFunction;
  lastFeelLogKeyRef: MutableRefObject<string | null>;
  setMoodDone: Dispatch<SetStateAction<boolean>>;
  setSelectedMood: Dispatch<SetStateAction<MoodValue | null>>;
  setFeelIntensity: Dispatch<SetStateAction<number | null>>;
  setSelectedBriefFace: Dispatch<SetStateAction<FeelStepTile | null>>;
}): {
  handleMoodSelect: (
    mood: MoodValue,
    intensity?: number,
    opts?: { briefRitual?: boolean; briefFace?: FeelStepTile },
  ) => Promise<void>;
  handleMoodSkip: () => Promise<void>;
  handleMoodReset: () => void;
} {
  const {
    pauseInstanceId,
    t,
    lastFeelLogKeyRef,
    setMoodDone,
    setSelectedMood,
    setFeelIntensity,
    setSelectedBriefFace,
  } = input;

  const applyInitialEmotionUi = useCallback(
    (ui: InitialEmotionUiState) => {
      setMoodDone(ui.moodDone);
      setSelectedMood(ui.selectedMood);
      setFeelIntensity(ui.feelIntensity);
      setSelectedBriefFace(ui.selectedBriefFace);
    },
    [setMoodDone, setSelectedMood, setFeelIntensity, setSelectedBriefFace],
  );

  const handleMoodSelect = useCallback(
    async (
      mood: MoodValue,
      intensity?: number,
      opts?: { briefRitual?: boolean; briefFace?: FeelStepTile },
    ) => {
      hapticFeedback('light');
      const outcome = await runInitialEmotionSelect(
        {
          pauseInstanceId,
          mood,
          intensity,
          opts,
          lastFeelLogKey: lastFeelLogKeyRef.current,
        },
        { logStep: logInitialEmotionStep },
      );

      if (outcome.status === 'synced') {
        lastFeelLogKeyRef.current = outcome.logKey;
      } else if (outcome.status === 'sync_failed') {
        lastFeelLogKeyRef.current = null;
        showPauseStepSyncFailedToast(t);
      }

      applyInitialEmotionUi(outcome.ui);
    },
    [pauseInstanceId, t, lastFeelLogKeyRef, applyInitialEmotionUi],
  );

  const handleMoodSkip = useCallback(async () => {
    const outcome = await runInitialEmotionSkip(
      { pauseInstanceId },
      { logStep: logInitialEmotionStep },
    );

    if (outcome.status === 'sync_failed') {
      showPauseStepSyncFailedToast(t);
      return;
    }

    if (outcome.status === 'synced') {
      lastFeelLogKeyRef.current = outcome.logKey;
    }

    setFeelIntensity(outcome.ui.feelIntensity);
    setMoodDone(outcome.ui.moodDone);
  }, [pauseInstanceId, t, lastFeelLogKeyRef, setFeelIntensity, setMoodDone]);

  const handleMoodReset = useCallback(() => {
    lastFeelLogKeyRef.current = null;
    applyInitialEmotionUi(initialEmotionResetUi());
  }, [lastFeelLogKeyRef, applyInitialEmotionUi]);

  return { handleMoodSelect, handleMoodSkip, handleMoodReset };
}
