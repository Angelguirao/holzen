import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { MoodValue } from '@/screens/pause/components/MoodCheck';
import type { FeelStepTile } from '@/screens/pause/components/pause-feel-types';
import { hapticFeedback } from '@/lib/haptics';
import { pauseLogStep } from '@/features/pause/public-rpc';
import {
  buildInitialEmotionLoggedPayload,
  initialEmotionLogDedupeKey,
  initialEmotionSkippedLogDedupeKey,
  initialEmotionSkippedLoggedPayload,
} from '@/features/pause/public';
import { showPauseStepSyncFailedToast } from '@/features/pause/public';

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

  const handleMoodSelect = useCallback(
    async (
      mood: MoodValue,
      intensity?: number,
      opts?: { briefRitual?: boolean; briefFace?: FeelStepTile },
    ) => {
      hapticFeedback('light');
      const payload = buildInitialEmotionLoggedPayload(mood, intensity, opts);
      const logKey = initialEmotionLogDedupeKey(payload, opts?.briefFace);
      if (pauseInstanceId && lastFeelLogKeyRef.current === logKey) {
        setMoodDone(true);
        setSelectedMood(mood);
        setFeelIntensity(typeof intensity === 'number' ? intensity : null);
        if (opts?.briefFace) setSelectedBriefFace(opts.briefFace);
        return;
      }
      setMoodDone(true);
      setSelectedMood(mood);
      setFeelIntensity(typeof intensity === 'number' ? intensity : null);
      if (opts?.briefFace) setSelectedBriefFace(opts.briefFace);
      if (pauseInstanceId) {
        try {
          await pauseLogStep({
            instanceId: pauseInstanceId,
            stepType: 'initial_emotion_logged',
            payload,
          });
          lastFeelLogKeyRef.current = logKey;
        } catch {
          lastFeelLogKeyRef.current = null;
          setMoodDone(false);
          setSelectedMood(null);
          setFeelIntensity(null);
          showPauseStepSyncFailedToast(t);
        }
      }
    },
    [
      pauseInstanceId,
      t,
      lastFeelLogKeyRef,
      setMoodDone,
      setSelectedMood,
      setFeelIntensity,
      setSelectedBriefFace,
    ],
  );

  const handleMoodSkip = useCallback(async () => {
    setFeelIntensity(null);
    if (pauseInstanceId) {
      try {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'initial_emotion_logged',
          payload: initialEmotionSkippedLoggedPayload(),
        });
        lastFeelLogKeyRef.current = initialEmotionSkippedLogDedupeKey();
      } catch {
        showPauseStepSyncFailedToast(t);
        return;
      }
    }
    setMoodDone(true);
  }, [pauseInstanceId, t, lastFeelLogKeyRef, setFeelIntensity, setMoodDone]);

  const handleMoodReset = useCallback(() => {
    lastFeelLogKeyRef.current = null;
    setMoodDone(false);
    setSelectedMood(null);
    setFeelIntensity(null);
    setSelectedBriefFace(null);
  }, [lastFeelLogKeyRef, setMoodDone, setSelectedMood, setFeelIntensity, setSelectedBriefFace]);

  return { handleMoodSelect, handleMoodSkip, handleMoodReset };
}
