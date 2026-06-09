import { useLayoutEffect, useOptimistic, useState } from 'react';
import {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialDecisionFromRestored,
  initialFrameDoneFromRestored,
  initialPhaseFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
  mapPersistedStep,
} from './pause-session-ritual-restore-io';
import type { PauseImpactData } from './pause-session-decide-io';
import type { PersistedSession } from '@/features/pause/domain/session-model';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';
import type { MoodValue } from '../../domain/mood-value';
import { usePauseSessionEntryPresentationEffects } from './use-pause-session-entry-presentation-effects';

/**
 * In-session ritual UI state for `/pause` (step, mood, breath progress, depth picker).
 * Initialized from `loadSession` / shell `restored` snapshot; persisted via `usePauseSessionPersistToStorage`.
 */
export function usePauseSessionRitualState(
  restored: PersistedSession | null,
  options?: { startAtDepthPicker?: boolean; restartEngagedRitual?: boolean },
) {
  const startAtDepthPicker = options?.startAtDepthPicker === true;
  const restartEngagedRitual = options?.restartEngagedRitual === true;
  const ritualBootstrap = restartEngagedRitual ? null : restored;
  const restoredStep = restartEngagedRitual ? 'feel' : mapPersistedStep(restored?.step);

  const [step, setStep] = useState<PauseStep>(restoredStep);
  const [phase, setPhase] = useState<'session' | 'done'>(() => initialPhaseFromRestored(ritualBootstrap));
  const [decision, setDecision] = useState<string | null>(() => initialDecisionFromRestored(ritualBootstrap));

  const [isFavoriteCommitted, setIsFavorite] = useState(false);
  const [isFavorite, addOptimisticFavorite] = useOptimistic(
    isFavoriteCommitted,
    (_current, next: boolean) => next,
  );
  const [moodDone, setMoodDone] = useState(ritualBootstrap?.moodDone ?? false);
  const [moodAfterDone, setMoodAfterDone] = useState(ritualBootstrap?.moodAfterDone ?? false);
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(ritualBootstrap?.selectedMood ?? null);
  const [selectedMoodAfter, setSelectedMoodAfter] = useState<MoodValue | null>(
    ritualBootstrap?.selectedMoodAfter ?? null,
  );
  const [feelIntensity, setFeelIntensity] = useState<number | null>(ritualBootstrap?.feelIntensity ?? null);
  const [shiftIntensity, setShiftIntensity] = useState<number | null>(ritualBootstrap?.shiftIntensity ?? null);
  const [breathingFirstCompleted, setBreathingFirstCompleted] = useState(() =>
    initialBreathingFirstCompletedFromRestored(ritualBootstrap),
  );
  const [breathingSecondCompleted, setBreathingSecondCompleted] = useState(() =>
    initialBreathingSecondCompletedFromRestored(ritualBootstrap),
  );
  const [frameDone, setFrameDone] = useState(() => initialFrameDoneFromRestored(ritualBootstrap));
  const [curtainLifted, setCurtainLifted] = useState(false);
  const [pauseImpactData, setPauseImpactData] = useState<PauseImpactData | null>(null);
  const [ritualStartedAtMs, setRitualStartedAtMs] = useState<number | null>(() => {
    if (restartEngagedRitual) return Date.now();
    if (ritualBootstrap?.ritualDepth) return Date.now();
    return null;
  });

  const [ritualEntry, setRitualEntry] = useState<RitualDepth | 'picker'>(() => {
    if (startAtDepthPicker) return 'picker';
    if (restartEngagedRitual) return 'deep';
    return initialRitualEntry(restored);
  });
  const [briefStep, setBriefStep] = useState<BriefPauseStep>(() => initialBriefPauseStepFromRestored(ritualBootstrap));
  const [briefIntegrateDone, setBriefIntegrateDone] = useState(() =>
    initialBriefIntegrateDoneFromRestored(ritualBootstrap),
  );
  const [selectedBriefFace, setSelectedBriefFace] = useState(() => initialSelectedBriefFaceFromRestored(ritualBootstrap));

  const [swipeDirection, setSwipeDirection] = useState<'forward' | 'back'>('forward');
  const [soundMuted, setSoundMuted] = useState(true);

  usePauseSessionEntryPresentationEffects({ setCurtainLifted });

  useLayoutEffect(() => {
    if (ritualEntry === 'picker') return;
    setRitualStartedAtMs((prev) => prev ?? Date.now());
  }, [ritualEntry]);

  return {
    step,
    setStep,
    phase,
    setPhase,
    decision,
    setDecision,
    isFavorite,
    isFavoriteCommitted,
    addOptimisticFavorite,
    setIsFavorite,
    moodDone,
    setMoodDone,
    moodAfterDone,
    setMoodAfterDone,
    selectedMood,
    setSelectedMood,
    selectedMoodAfter,
    setSelectedMoodAfter,
    feelIntensity,
    setFeelIntensity,
    shiftIntensity,
    setShiftIntensity,
    breathingFirstCompleted,
    setBreathingFirstCompleted,
    breathingSecondCompleted,
    setBreathingSecondCompleted,
    frameDone,
    setFrameDone,
    curtainLifted,
    pauseImpactData,
    setPauseImpactData,
    ritualStartedAtMs,
    ritualEntry,
    setRitualEntry,
    briefStep,
    setBriefStep,
    briefIntegrateDone,
    setBriefIntegrateDone,
    selectedBriefFace,
    setSelectedBriefFace,
    swipeDirection,
    setSwipeDirection,
    soundMuted,
    setSoundMuted,
  };
}
