import { useCallback } from 'react';
import { usePauseFavoriteToggle } from '@/features/pause/public-hooks';
import { usePauseSessionMoodAndPersist } from '@/screens/pause/hooks/use-pause-session-mood-and-persist';
import type { usePauseSessionProviders } from '@/screens/pause/hooks/use-pause-session-providers';
import type { usePauseSessionShellRitual } from '@/screens/pause/hooks/use-pause-session-shell-ritual';

type PauseSessionProviders = ReturnType<typeof usePauseSessionProviders>;
type PauseSessionShellRitual = ReturnType<typeof usePauseSessionShellRitual>;

/** Mood persistence, favorite toggle, and pause chrome close for the session ritual. */
export function usePauseSessionMoodChromeHandlers(
  p: Pick<PauseSessionProviders, 't' | 'handleReturn' | 'subscribed' | 'requirePro'>,
  { shell, ritual }: PauseSessionShellRitual,
) {
  const { t, handleReturn, subscribed, requirePro } = p;
  const {
    message,
    context,
    pauseInstanceId,
    companions,
    companionPrefs,
    severity,
    requestExitPauseBeforeDone,
  } = shell;

  const {
    phase,
    ritualEntry,
    moodDone,
    moodAfterDone,
    selectedMood,
    selectedMoodAfter,
    feelIntensity,
    shiftIntensity,
    decision,
    step,
    breathingFirstCompleted,
    breathingSecondCompleted,
    frameDone,
    briefStep,
    briefIntegrateDone,
    selectedBriefFace,
    isFavorite,
    setIsFavorite,
    setRitualEntry,
    setBriefStep,
    setBriefIntegrateDone,
    setSelectedBriefFace,
    setMoodDone,
    setSelectedMood,
    setFeelIntensity,
  } = ritual;

  const { toggleFavorite } = usePauseFavoriteToggle({
    pauseInstanceId,
    isFavorite,
    setIsFavorite,
    subscribed,
    t,
  });

  const handlePauseSessionChromeClose = useCallback(() => {
    if (phase === 'done') {
      handleReturn();
    } else {
      requestExitPauseBeforeDone();
    }
  }, [phase, handleReturn, requestExitPauseBeforeDone]);

  const mood = usePauseSessionMoodAndPersist({
    pauseInstanceId,
    t,
    requirePro,
    ritualEntry,
    message,
    context,
    companions,
    companionPrefs,
    severity,
    moodDone,
    moodAfterDone,
    selectedMood,
    selectedMoodAfter,
    feelIntensity,
    shiftIntensity,
    phase,
    decision,
    step,
    breathingFirstCompleted,
    breathingSecondCompleted,
    frameDone,
    briefStep,
    briefIntegrateDone,
    selectedBriefFace,
    setRitualEntry,
    setBriefStep,
    setBriefIntegrateDone,
    setSelectedBriefFace,
    setMoodDone,
    setSelectedMood,
    setFeelIntensity,
  });

  return { mood, toggleFavorite, handlePauseSessionChromeClose };
}
