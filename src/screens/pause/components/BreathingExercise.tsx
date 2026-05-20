import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  STANDALONE_BREATHING_CYCLE_COUNT,
  STANDALONE_BREATHING_PATTERNS,
  computeBreathingPhaseAdvance,
  resolveBreathOrbVisualMetrics,
  resolveStandaloneBreathSeverityRingColors,
  resolveSuggestedStandaloneBreathingPatternIndex,
  type BreathingExerciseSeverity,
} from '@/features/pause/public';
import { BreathingExerciseOverlay } from '@/screens/pause/components/breathing-exercise-overlay';

interface Props {
  severity?: BreathingExerciseSeverity;
  onComplete?: () => void;
  onClose?: () => void;
  autoOpen?: boolean;
}

export function BreathingExercise({ severity = 'mild', onComplete, onClose, autoOpen = false }: Props) {
  const { t } = useTranslation();
  const [overlayOpen, setOverlayOpen] = useState(autoOpen);
  const [patternIndex, setPatternIndex] = useState(() =>
    resolveSuggestedStandaloneBreathingPatternIndex(severity),
  );
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [completed, setCompleted] = useState(false);

  const pattern = STANDALONE_BREATHING_PATTERNS[patternIndex] ?? STANDALONE_BREATHING_PATTERNS[0];
  const currentPhase = pattern.phases[phaseIndex] ?? pattern.phases[0];
  const suggestedPatternIndex = resolveSuggestedStandaloneBreathingPatternIndex(severity);
  const ringColors = useMemo(() => resolveStandaloneBreathSeverityRingColors(severity), [severity]);

  const pulseClass = severity === 'high' ? 'animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]' : '';

  const reset = useCallback(() => {
    setActive(false);
    setPhaseIndex(0);
    setElapsed(0);
    setCycle(0);
    setCompleted(false);
  }, []);

  const startExercise = useCallback(() => {
    reset();
    setActive(true);
  }, [reset]);

  const openOverlay = useCallback(() => {
    setPatternIndex(resolveSuggestedStandaloneBreathingPatternIndex(severity));
    reset();
    setOverlayOpen(true);
  }, [severity, reset]);

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false);
    if (!completed) onClose?.();
    reset();
  }, [reset, completed, onClose]);

  useEffect(() => {
    if (!active || completed) return;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        const advance = computeBreathingPhaseAdvance({
          elapsed: next,
          phaseDuration: currentPhase.duration,
          phaseIndex,
          phaseCount: pattern.phases.length,
          cycle,
          totalCycles: STANDALONE_BREATHING_CYCLE_COUNT,
        });

        if (advance.kind === 'tick') return next;

        if (advance.kind === 'pattern_complete') {
          setActive(false);
          setCompleted(true);
          onComplete?.();
          return 0;
        }
        if (advance.kind === 'next_cycle') {
          setCycle(advance.nextCycle);
          setPhaseIndex(0);
          return 0;
        }
        setPhaseIndex(advance.nextPhaseIndex);
        return 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [
    active,
    completed,
    phaseIndex,
    cycle,
    currentPhase.duration,
    pattern.phases.length,
    onComplete,
  ]);

  const { orbScale } = resolveBreathOrbVisualMetrics({
    phaseLabelKey: currentPhase.labelKey,
    elapsed,
    phaseDuration: currentPhase.duration,
  });
  const secondsRemaining = Math.max(0, currentPhase.duration - elapsed);

  if (!overlayOpen) {
    return (
      <button
        type="button"
        onClick={openOverlay}
        className={`text-xs font-mono text-muted-foreground hover:text-foreground transition-colors ${pulseClass}`}
      >
        {t('breathing.trigger')}
      </button>
    );
  }

  return (
    <AnimatePresence>
      {overlayOpen ? (
        <BreathingExerciseOverlay
          severity={severity}
          ringColors={ringColors}
          patterns={STANDALONE_BREATHING_PATTERNS}
          patternIndex={patternIndex}
          suggestedPatternIndex={suggestedPatternIndex}
          active={active}
          completed={completed}
          phaseLabelKey={currentPhase.labelKey}
          phaseMotionKey={`${phaseIndex}-${cycle}`}
          orbScale={orbScale}
          secondsRemaining={secondsRemaining}
          cycle={cycle}
          totalCycles={STANDALONE_BREATHING_CYCLE_COUNT}
          patternNameKey={pattern.nameKey}
          onClose={closeOverlay}
          onSelectPattern={setPatternIndex}
          onStart={startExercise}
        />
      ) : null}
    </AnimatePresence>
  );
}
