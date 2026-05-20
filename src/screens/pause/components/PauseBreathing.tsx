import { useState, useEffect, useImperativeHandle, forwardRef, useRef, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { FeelStepTile } from '@/features/pause/public';
import { pauseStepLayout } from '@/features/pause/public';
import { hapticFeedback } from '@/lib/haptics';
import {
  computeBreathingPhaseAdvance,
  resolveBreathOrbVisualMetrics,
  resolveBreathingCompleted,
  resolveBreathingPhaseAdvanceOutcome,
} from '@/features/pause/public';
import {
  resolveBreathCycleTotal,
  resolvePauseBreathingPhases,
  rotatingKickerIndexFromElapsed,
  secondsIntoTrianglePattern,
} from '@/features/pause/public';
import {
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
  resumePauseAudioContext,
} from '@/features/pause/public';
import { BriefBreathAdvanceToIntegrate } from '@/screens/pause/components/brief-breath-advance-to-integrate';
import { DeepBreathPostPatternInterstitial } from '@/screens/pause/components/deep-breath-post-pattern-interstitial';
import { PauseBreathIntro } from '@/screens/pause/components/pause-breath-intro';
import type { PauseBreathSegment } from '@/screens/pause/components/pause-breath-intro';
import { PauseBreathTimedLoop } from '@/screens/pause/components/pause-breath-timed-loop';

/** i18n: `breathing.triangleRotatingKickers` — advances every 2s in `PauseBreathing`, not per phase. */
const TRIANGLE_ROTATING_KICKERS_I18N_KEY = 'breathing.triangleRotatingKickers';

export type { PauseBreathingHandle } from '@/features/pause/public';
import type { PauseBreathingHandle } from '@/features/pause/public';

export type { PauseBreathSegment };

interface Props {
  mantra: string | null;
  /** Retained for future Feel-tile pattern routing (`pause-breathing-pattern.ts`). */
  severity?: 'mild' | 'moderate' | 'high';
  /**
   * Brief vs deep only changes post-pattern behavior (auto-advance vs interstitial).
   * Phases are triangle for both until `PAUSE_RITUAL_BREATHING_PATTERN_MODE` enables feel-tile routing.
   */
  ritualVariant?: 'brief' | 'deep';
  /** First segment after Feel; second segment after Frame (deep pause only). */
  breathSegment?: PauseBreathSegment;
  /**
   * Feel grid tile from the shared ritual step; passed through for future `feel_tile_mapped` breathing.
   * Optional until design wires pattern choice.
   */
  feelTile?: FeelStepTile | null;
  /** After full breath cycles: deep shows an interstitial then continues; brief auto-invokes (Integrate). */
  onContinueAfterBreath: () => void;
  /** Intro or mid-pattern skip: leave breath without logging completion. */
  onSkipBreath: () => void | Promise<void>;
  completed?: boolean;
  /** Fires when timed cycles finish — parent may mark session “past pattern” for header chrome (no DB log yet). */
  onPatternComplete?: () => void;
  /** True while the countdown / phase loop is running (not intro, not completion card). */
  onTimedBreathingChange?: (active: boolean) => void;
  /** Header mute: when true, phase ticks and pattern-complete chime are suppressed. */
  ritualSoundMuted?: boolean;
  /** Deep first Breathe post-pattern: tap to run three more rounds from intro (parent clears segment completion). */
  onRepeatDeepFirstBreathPattern?: () => void;
  /** Deep second Breathe post-pattern: same affordance as first interstitial (wireframe 330:23551). */
  onRepeatDeepSecondBreathPattern?: () => void;
}

export const PauseBreathing = forwardRef<PauseBreathingHandle, Props>(function PauseBreathing(
  {
    mantra,
    severity = 'mild',
    ritualVariant,
    breathSegment = 'first',
    feelTile = null,
    onContinueAfterBreath,
    onSkipBreath,
    completed: completedProp,
    onPatternComplete,
    onTimedBreathingChange,
    ritualSoundMuted = false,
    onRepeatDeepFirstBreathPattern,
    onRepeatDeepSecondBreathPattern,
  },
  ref,
) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const cueOptsRef = useRef({ muted: ritualSoundMuted, prefersReduced: !!prefersReduced });
  useEffect(() => {
    cueOptsRef.current = { muted: ritualSoundMuted, prefersReduced: !!prefersReduced };
  }, [ritualSoundMuted, prefersReduced]);

  const ritualVar: 'brief' | 'deep' = ritualVariant ?? 'deep';
  const pattern = useMemo(
    () => ({
      phases: resolvePauseBreathingPhases({
        ritualVariant: ritualVar,
        feelTile,
        severity,
      }),
    }),
    [ritualVar, feelTile, severity],
  );
  const totalCycles = resolveBreathCycleTotal(ritualVariant, breathSegment);
  const showPhaseHints = ritualVariant === 'brief' || ritualVariant === 'deep';
  /** Triangle UX: seconds within the phase count 1 → duration (same for brief and deep). */
  const phaseSecondCountsUp = true;

  const [started, setStarted] = useState(!!completedProp);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [completedLocal, setCompletedLocal] = useState(!!completedProp);

  const completed = resolveBreathingCompleted(completedProp, completedLocal);
  const currentPhase = pattern.phases[phaseIndex];

  const phaseDurationsSec = useMemo(() => pattern.phases.map((p) => p.duration), [pattern.phases]);

  const triangleRotatingKickers = useMemo((): string[] => {
    const raw = t(TRIANGLE_ROTATING_KICKERS_I18N_KEY, { returnObjects: true }) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((x): x is string => typeof x === 'string');
  }, [t]);

  const secondsIntoTrianglePatternMemo = useMemo(
    () =>
      secondsIntoTrianglePattern({
        cycle,
        phaseIndex,
        elapsedInCurrentPhase: elapsed,
        phaseDurationsSec,
      }),
    [cycle, phaseIndex, elapsed, phaseDurationsSec],
  );

  const triangleKickerIndex = useMemo(
    () => rotatingKickerIndexFromElapsed(secondsIntoTrianglePatternMemo, triangleRotatingKickers.length),
    [secondsIntoTrianglePatternMemo, triangleRotatingKickers.length],
  );

  const triangleKickerLine =
    triangleRotatingKickers.length > 0 ? (triangleRotatingKickers[triangleKickerIndex] ?? '') : '';

  const onPatternCompleteRef = useRef(onPatternComplete);
  onPatternCompleteRef.current = onPatternComplete;
  const ritualVariantRef = useRef(ritualVariant);
  ritualVariantRef.current = ritualVariant;
  const phaseAdvanceGuardRef = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      resetToIntro: () => {
        setStarted(false);
        setPhaseIndex(0);
        setElapsed(0);
        setCycle(0);
        setCompletedLocal(false);
        phaseAdvanceGuardRef.current = false;
      },
    }),
    [],
  );

  const inTimedLoop = started && !completed;
  useEffect(() => {
    onTimedBreathingChange?.(inTimedLoop);
  }, [inTimedLoop, onTimedBreathingChange]);

  /** One tick per second; do not reset this interval when parent passes new callback refs. */
  useEffect(() => {
    if (!started || completed) return;
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [started, completed]);

  /** When the phase countdown completes, advance cycle/phase or finish the pattern. */
  useEffect(() => {
    if (!started || completed) return;
    const phase = pattern.phases[phaseIndex];
    if (elapsed < phase.duration) {
      phaseAdvanceGuardRef.current = false;
      return;
    }
    if (phaseAdvanceGuardRef.current) return;
    phaseAdvanceGuardRef.current = true;

    const advance = computeBreathingPhaseAdvance({
      elapsed,
      phaseDuration: phase.duration,
      phaseIndex,
      phaseCount: pattern.phases.length,
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
  }, [started, completed, elapsed, phaseIndex, cycle, pattern, totalCycles, completedLocal]);

  const { orbScale: scale, phaseProgress: progress, showHoldMandala, holdProgress } =
    resolveBreathOrbVisualMetrics({
      phaseLabelKey: currentPhase.labelKey,
      elapsed,
      phaseDuration: currentPhase.duration,
    });

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {!started ? (
        <PauseBreathIntro
          breathSegment={breathSegment}
          mantra={mantra}
          ritualVariant={ritualVar}
          prefersReducedMotion={!!prefersReduced}
          onStart={() => {
            void resumePauseAudioContext();
            setStarted(true);
          }}
          onSkipBreath={onSkipBreath}
        />
      ) : !completed ? (
        <PauseBreathTimedLoop
          orbScale={scale}
          phaseProgress={progress}
          showHoldMandala={showHoldMandala}
          holdProgress={holdProgress}
          prefersReducedMotion={!!prefersReduced}
          phaseLabelKey={currentPhase.labelKey}
          phaseSecondCountsUp={phaseSecondCountsUp}
          elapsed={elapsed}
          phaseDuration={currentPhase.duration}
          showPhaseHints={showPhaseHints}
          triangleKickerLine={triangleKickerLine}
          triangleKickerIndex={triangleKickerIndex}
          hasTriangleKickers={triangleRotatingKickers.length > 0}
          cycle={cycle}
          totalCycles={totalCycles}
          phaseIndex={phaseIndex}
        />
      ) : ritualVariant === 'brief' ? (
        <BriefBreathAdvanceToIntegrate
          onContinue={onContinueAfterBreath}
          onAdvanceFailed={() => {
            setCompletedLocal(false);
            phaseAdvanceGuardRef.current = false;
          }}
        />
      ) : ritualVariant === 'deep' ? (
        <DeepBreathPostPatternInterstitial
          segment={breathSegment}
          prefersReducedMotion={!!prefersReduced}
          onContinueAfterBreath={onContinueAfterBreath}
          onRepeatPattern={
            breathSegment === 'first'
              ? onRepeatDeepFirstBreathPattern
              : onRepeatDeepSecondBreathPattern
          }
        />
      ) : null}

    </motion.div>
  );
});
