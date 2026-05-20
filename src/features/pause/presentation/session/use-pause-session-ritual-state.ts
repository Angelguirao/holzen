import { useState } from 'react';
import type { PauseImpactData } from '@/features/pause/application/use-cases/ritual/decide/impact-data';
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
} from '@/features/pause/application/use-cases/session/step-map';
import type { PersistedSession } from '@/features/pause/domain/session-model';
import type { BriefPauseStep, PauseStep, RitualDepth } from '@/features/pause/public-hooks';
import type { MoodValue } from '../../domain/mood-value';
import { usePauseSessionEntryPresentationEffects } from './use-pause-session-entry-presentation-effects';

/**
 * In-session ritual UI state for `/pause` (step, mood, breath progress, depth picker).
 * Initialized from `loadSession` / shell `restored` snapshot; persisted via `usePauseSessionPersistToStorage`.
 */
export function usePauseSessionRitualState(restored: PersistedSession | null) {
  const restoredStep = mapPersistedStep(restored?.step);

  const [step, setStep] = useState<PauseStep>(restoredStep);
  const [phase, setPhase] = useState<'session' | 'done'>(() => initialPhaseFromRestored(restored));
  const [decision, setDecision] = useState<string | null>(() => initialDecisionFromRestored(restored));

  const [isFavorite, setIsFavorite] = useState(false);
  const [moodDone, setMoodDone] = useState(restored?.moodDone ?? false);
  const [moodAfterDone, setMoodAfterDone] = useState(restored?.moodAfterDone ?? false);
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(restored?.selectedMood ?? null);
  const [selectedMoodAfter, setSelectedMoodAfter] = useState<MoodValue | null>(
    restored?.selectedMoodAfter ?? null,
  );
  const [feelIntensity, setFeelIntensity] = useState<number | null>(restored?.feelIntensity ?? null);
  const [shiftIntensity, setShiftIntensity] = useState<number | null>(restored?.shiftIntensity ?? null);
  const [breathingFirstCompleted, setBreathingFirstCompleted] = useState(() =>
    initialBreathingFirstCompletedFromRestored(restored),
  );
  const [breathingSecondCompleted, setBreathingSecondCompleted] = useState(() =>
    initialBreathingSecondCompletedFromRestored(restored),
  );
  const [frameDone, setFrameDone] = useState(() => initialFrameDoneFromRestored(restored));
  const [curtainLifted, setCurtainLifted] = useState(false);
  const [pauseImpactData, setPauseImpactData] = useState<PauseImpactData | null>(null);

  const [ritualEntry, setRitualEntry] = useState<RitualDepth | 'picker'>(() => initialRitualEntry(restored));
  const [briefStep, setBriefStep] = useState<BriefPauseStep>(() => initialBriefPauseStepFromRestored(restored));
  const [briefIntegrateDone, setBriefIntegrateDone] = useState(() =>
    initialBriefIntegrateDoneFromRestored(restored),
  );
  const [selectedBriefFace, setSelectedBriefFace] = useState(() => initialSelectedBriefFaceFromRestored(restored));

  const [swipeDirection, setSwipeDirection] = useState<'forward' | 'back'>('forward');
  const [soundMuted, setSoundMuted] = useState(true);

  usePauseSessionEntryPresentationEffects({ setCurtainLifted });

  return {
    step,
    setStep,
    phase,
    setPhase,
    decision,
    setDecision,
    isFavorite,
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
