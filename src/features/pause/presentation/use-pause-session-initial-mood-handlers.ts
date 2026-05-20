import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { FeelStepTile } from '@/features/pause/public';
import type { MoodValue } from '../domain/mood-value';
import { hapticFeedback } from '@/lib/haptics';
import {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '@/features/pause/public-rpc';
import { showPauseStepSyncFailedToast } from '@/features/pause/application/use-cases/feedback/step-sync-toast';
import {
  initialEmotionResetUi,
  type InitialEmotionUiState,
} from '@/features/pause/public';

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
      const outcome = await runInitialEmotionSelect({
        pauseInstanceId,
        mood,
        intensity,
        opts,
        lastFeelLogKey: lastFeelLogKeyRef.current,
      });

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
    const outcome = await runInitialEmotionSkip({ pauseInstanceId });

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
