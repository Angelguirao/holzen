import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { RefObject } from 'react';
import {
  PAUSE_SESSION_INACTIVITY_MS,
  PAUSE_SESSION_INACTIVITY_POLL_MS,
} from '@/features/pause/domain/session/pause-session-inactivity-ms';
import { pauseSessionRitualRestartFromFeelPatch } from '@/features/pause/application/use-cases/session/pause-session-ritual-restart-from-feel';
import { clearPausePersistedTabSession } from '@/features/pause/presentation/session/pause-persisted-tab-session-io';
import type { PauseBreathingHandle } from '@/features/pause/presentation/session/breath/pause-breathing-handle';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';
import type { MoodValue } from '@/features/pause/domain/mood-value';

type InactivityPorts = {
  phase: 'session' | 'done';
  ritualEntry: RitualDepth | 'picker';
  leaveWithPendingOpen: boolean;
  breathTimedActive: boolean;
  hasCoalescedShellSession: boolean;
  dismissOpenPauseFromWidget: () => void;
  handleReturn: () => void;
  setStep: Dispatch<SetStateAction<PauseStep>>;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
  setPhase: Dispatch<SetStateAction<'session' | 'done'>>;
  setMoodDone: Dispatch<SetStateAction<boolean>>;
  setMoodAfterDone: Dispatch<SetStateAction<boolean>>;
  setSelectedMood: Dispatch<SetStateAction<MoodValue | null>>;
  setSelectedMoodAfter: Dispatch<SetStateAction<MoodValue | null>>;
  setFeelIntensity: Dispatch<SetStateAction<number | null>>;
  setShiftIntensity: Dispatch<SetStateAction<number | null>>;
  setBreathingFirstCompleted: Dispatch<SetStateAction<boolean>>;
  setBreathingSecondCompleted: Dispatch<SetStateAction<boolean>>;
  setFrameDone: Dispatch<SetStateAction<boolean>>;
  setBriefIntegrateDone: Dispatch<SetStateAction<boolean>>;
  setDecision: Dispatch<SetStateAction<string | null>>;
  setSwipeDirection: Dispatch<SetStateAction<'forward' | 'back'>>;
  setBreathTimedActive: Dispatch<SetStateAction<boolean>>;
  setBreathFirstTimedPatternStarted: Dispatch<SetStateAction<boolean>>;
  setBreathSecondTimedPatternStarted: Dispatch<SetStateAction<boolean>>;
  breathingRef: RefObject<PauseBreathingHandle | null>;
};

function applyPauseSessionRitualRestartFromFeel(ports: InactivityPorts): void {
  clearPausePersistedTabSession();
  const patch = pauseSessionRitualRestartFromFeelPatch();
  ports.setStep(patch.step);
  ports.setBriefStep(patch.briefStep);
  ports.setPhase(patch.phase);
  ports.setMoodDone(patch.moodDone);
  ports.setMoodAfterDone(patch.moodAfterDone);
  ports.setSelectedMood(patch.selectedMood);
  ports.setSelectedMoodAfter(patch.selectedMoodAfter);
  ports.setFeelIntensity(patch.feelIntensity);
  ports.setShiftIntensity(patch.shiftIntensity);
  ports.setBreathingFirstCompleted(patch.breathingFirstCompleted);
  ports.setBreathingSecondCompleted(patch.breathingSecondCompleted);
  ports.setFrameDone(patch.frameDone);
  ports.setBriefIntegrateDone(patch.briefIntegrateDone);
  ports.setDecision(patch.decision);
  ports.setSwipeDirection(patch.swipeDirection);
  ports.setBreathTimedActive(false);
  ports.setBreathFirstTimedPatternStarted(false);
  ports.setBreathSecondTimedPatternStarted(false);
  queueMicrotask(() => ports.breathingRef.current?.resetToIntro());
}

/** Figma 435:19817 — idle detection + sheet actions during `/pause` ritual. */
export function usePauseSessionInactivitySheet(ports: InactivityPorts) {
  const [open, setOpen] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const openRef = useRef(open);
  openRef.current = open;

  const enabled =
    ports.phase === 'session' &&
    ports.ritualEntry !== 'picker' &&
    ports.hasCoalescedShellSession &&
    !ports.leaveWithPendingOpen &&
    !ports.breathTimedActive;

  const bumpActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const resetIdleClock = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled || open) return;
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    for (const eventName of events) {
      window.addEventListener(eventName, bumpActivity, { passive: true });
    }
    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, bumpActivity);
      }
    };
  }, [enabled, open, bumpActivity]);

  useEffect(() => {
    if (!enabled || open) return;
    const id = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= PAUSE_SESSION_INACTIVITY_MS) {
        setOpen(true);
      }
    }, PAUSE_SESSION_INACTIVITY_POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, open]);

  useEffect(() => {
    if (!open) return;
    lastActivityRef.current = Date.now();
  }, [open]);

  const onContinue = useCallback(() => {
    setOpen(false);
    resetIdleClock();
  }, [resetIdleClock]);

  const onStartOver = useCallback(() => {
    setOpen(false);
    applyPauseSessionRitualRestartFromFeel(ports);
    resetIdleClock();
  }, [ports, resetIdleClock]);

  const onDiscard = useCallback(() => {
    setOpen(false);
    clearPausePersistedTabSession();
    ports.dismissOpenPauseFromWidget();
    ports.handleReturn();
  }, [ports]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next && openRef.current) resetIdleClock();
    },
    [resetIdleClock],
  );

  return {
    inactivityOpen: open,
    inactivityHandlers: {
      onOpenChange,
      onContinue,
      onStartOver,
      onDiscard,
    },
  };
}

export type PauseSessionInactivitySheetSlice = ReturnType<typeof usePauseSessionInactivitySheet>;
