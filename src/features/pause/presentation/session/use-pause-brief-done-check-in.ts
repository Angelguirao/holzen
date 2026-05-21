import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import { clampFeelIntensity } from '@/features/pause/application/use-cases/ritual/feel/clamp-feel-intensity';
import type { MoodValue } from '../domain/mood-value';
import { showPauseStepSyncFailedToast } from '@/features/pause/application/use-cases/ritual/step-sync-toast';
import { isPauseMoodValue } from '@/features/pause/domain/mood-value';
import { logPostPauseEmotionIfDirty } from '@/features/pause/public-rpc';
import type { PostPauseFeelSnapshot } from '@/features/pause/application/use-cases/ritual/done/post-pause-emotion-log';

export type UsePauseBriefDoneCheckInParams = {
  doneVariant: 'default' | 'brief';
  pauseInstanceId: string | null | undefined;
  pauseData?: { mood: string | null; feelIntensity?: number | null } | null;
  onSaveToJourney?: () => void;
  t: TFunction;
};

/** Brief ritual done step — optional post-pause mood/intensity check-in before Journey. */
export function usePauseBriefDoneCheckIn({
  doneVariant,
  pauseInstanceId,
  pauseData,
  onSaveToJourney,
  t,
}: UsePauseBriefDoneCheckInParams) {
  const [briefDoneMood, setBriefDoneMood] = useState<MoodValue | null>(null);
  const [briefDoneIntensity, setBriefDoneIntensity] = useState(3);
  const [moodEditorOpen, setMoodEditorOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const initialFeelSnapshotRef = useRef<PostPauseFeelSnapshot | null>(null);

  useLayoutEffect(() => {
    if (doneVariant !== 'brief' || !pauseData) return;
    const m = isPauseMoodValue(pauseData.mood) ? pauseData.mood : null;
    const int = clampFeelIntensity(pauseData.feelIntensity ?? null);
    setBriefDoneMood(m);
    setBriefDoneIntensity(int);
    initialFeelSnapshotRef.current = { mood: m, intensity: int };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mood/feel fields only
  }, [doneVariant, pauseInstanceId, pauseData?.mood, pauseData?.feelIntensity]);

  const handleSaveToJourney = useCallback(async () => {
    if (!onSaveToJourney) return;
    setSaveBusy(true);
    try {
      const outcome = await logPostPauseEmotionIfDirty({
        pauseInstanceId: pauseInstanceId ?? null,
        mood: briefDoneMood,
        intensity: briefDoneIntensity,
        initialSnapshot: initialFeelSnapshotRef.current,
      });
      if (outcome.status === 'sync_failed') {
        showPauseStepSyncFailedToast(t);
        return;
      }
      onSaveToJourney();
    } finally {
      setSaveBusy(false);
    }
  }, [onSaveToJourney, pauseInstanceId, briefDoneMood, briefDoneIntensity, t]);

  return {
    briefDoneMood,
    setBriefDoneMood,
    briefDoneIntensity,
    setBriefDoneIntensity,
    moodEditorOpen,
    setMoodEditorOpen,
    saveBusy,
    handleSaveToJourney,
  };
}
