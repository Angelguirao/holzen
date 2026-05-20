import { useCallback, useEffect, useRef, useState } from 'react';
import {
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
  resolveBreathingPhaseAdvanceOutcome,
} from '@/features/pause/application/use-cases/breathing/phase-advance';
import {
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
} from '@/features/pause/application/use-cases/breathing/ritual-audio';
import { hapticFeedback } from '@/lib/haptics';

export type PauseBreathingPhase = {
  duration: number;
  labelKey: string;
};

export type UsePauseBreathingTimedLoopInput = {
  phases: readonly PauseBreathingPhase[];
  totalCycles: number;
  completedProp?: boolean;
  ritualVariant?: 'brief' | 'deep';
  ritualSoundMuted: boolean;
  prefersReduced: boolean;
  onPatternComplete?: () => void;
  onTimedBreathingChange?: (active: boolean) => void;
};

/**
 * Timed triangle breathing state (tick + phase advance) for in-ritual `PauseBreathing`.
 * Audio/haptics fire here; orb metrics and i18n stay in the screen component.
 */
export function usePauseBreathingTimedLoop({
  phases,
  totalCycles,
  completedProp,
  ritualVariant,
  ritualSoundMuted,
  prefersReduced,
  onPatternComplete,
  onTimedBreathingChange,
}: UsePauseBreathingTimedLoopInput) {
  const [started, setStarted] = useState(!!completedProp);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [completedLocal, setCompletedLocal] = useState(!!completedProp);

  const completed = resolveBreathingCompleted(completedProp, completedLocal);
  const currentPhase = phases[phaseIndex] ?? phases[0];

  const cueOptsRef = useRef({ muted: ritualSoundMuted, prefersReduced });
  useEffect(() => {
    cueOptsRef.current = { muted: ritualSoundMuted, prefersReduced };
  }, [ritualSoundMuted, prefersReduced]);

  const onPatternCompleteRef = useRef(onPatternComplete);
  onPatternCompleteRef.current = onPatternComplete;
  const ritualVariantRef = useRef(ritualVariant);
  ritualVariantRef.current = ritualVariant;
  const phaseAdvanceGuardRef = useRef(false);

  const resetToIntro = useCallback(() => {
    setStarted(false);
    setPhaseIndex(0);
    setElapsed(0);
    setCycle(0);
    setCompletedLocal(false);
    phaseAdvanceGuardRef.current = false;
  }, []);

  const inTimedLoop = started && !completed;
  useEffect(() => {
    onTimedBreathingChange?.(inTimedLoop);
  }, [inTimedLoop, onTimedBreathingChange]);

  useEffect(() => {
    if (!started || completed) return;
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [started, completed]);

  useEffect(() => {
    if (!started || completed) return;
    const phase = phases[phaseIndex];
    if (!phase || elapsed < phase.duration) {
      phaseAdvanceGuardRef.current = false;
      return;
    }
    if (phaseAdvanceGuardRef.current) return;
    phaseAdvanceGuardRef.current = true;

    const advance = computeBreathingPhaseAdvance({
      elapsed,
      phaseDuration: phase.duration,
      phaseIndex,
      phaseCount: phases.length,
      cycle,
      totalCycles,
    });

    const outcome = resolveBreathingPhaseAdvanceOutcome({
      advance,
      ritualVariant: ritualVariantRef.current,
      current: { cycle, phaseIndex, elapsed, completedLocal },
    });

    if (outcome.kind === 'noop') {
      phaseAdvanceGuardRef.current = false;
      return;
    }

    const o = cueOptsRef.current;
    if (outcome.playPatternCompleteCue) {
      playPauseBreathPatternCompleteCue({ muted: o.muted, prefersReducedMotion: o.prefersReduced });
    } else if (outcome.playPhaseCue) {
      playPauseBreathPhaseCue({ muted: o.muted, prefersReducedMotion: o.prefersReduced });
    }
    if (outcome.notifyPatternComplete) {
      onPatternCompleteRef.current?.();
    }
    if (outcome.hapticSuccess) {
      hapticFeedback('success');
    }
    setCycle(outcome.state.cycle);
    setPhaseIndex(outcome.state.phaseIndex);
    setElapsed(outcome.state.elapsed);
    setCompletedLocal(outcome.state.completedLocal);
    phaseAdvanceGuardRef.current = false;
  }, [started, completed, elapsed, phaseIndex, cycle, phases, totalCycles, completedLocal]);

  return {
    started,
    setStarted,
    completed,
    completedLocal,
    setCompletedLocal,
    phaseIndex,
    cycle,
    elapsed,
    currentPhase,
    resetToIntro,
    phaseAdvanceGuardRef,
  };
}
