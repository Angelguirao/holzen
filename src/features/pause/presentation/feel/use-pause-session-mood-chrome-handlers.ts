import { useCallback } from 'react';
import {
  resolvePauseSessionChromeCloseAction,
  runPauseSessionChromeCloseAction,
} from './pause-feel-io';
import { usePauseFavoriteToggle } from '../reflect/steps/use-pause-favorite-toggle';
import { usePauseSessionMoodAndPersist } from './use-pause-session-mood-and-persist';
import type {
  PauseSessionMoodChromeProvidersSlice,
  PauseSessionMoodChromeRitualSlice,
  PauseSessionMoodChromeShellSlice,
} from './pause-session-mood-chrome-handler-types';

/** Mood persistence, favorite toggle, and pause chrome close for the session ritual. */
export function usePauseSessionMoodChromeHandlers(
  p: PauseSessionMoodChromeProvidersSlice,
  {
    shell,
    ritual,
  }: {
    shell: PauseSessionMoodChromeShellSlice;
    ritual: PauseSessionMoodChromeRitualSlice;
  },
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
    ritualStartedAtMs,
    isFavorite,
    isFavoriteCommitted,
    addOptimisticFavorite,
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
    isFavoriteCommitted,
    addOptimisticFavorite,
    setIsFavorite: (value) => setIsFavorite(value),
    subscribed,
    t,
  });

  const handlePauseSessionChromeClose = useCallback(() => {
    runPauseSessionChromeCloseAction(resolvePauseSessionChromeCloseAction(phase), {
      onReturn: handleReturn,
      onRequestExit: requestExitPauseBeforeDone,
    });
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
    ritualStartedAtMs,
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
