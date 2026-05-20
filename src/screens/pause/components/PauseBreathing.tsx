import { useState, useEffect, useImperativeHandle, forwardRef, useRef, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { FeelStepTile } from '@/features/pause/public';
import { pauseStepLayout } from '@/features/pause/public';
import { hapticFeedback } from '@/lib/haptics';
import {
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
} from '@/features/pause/public';
import {
  holdProgressWithinPhase,
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

const EXPAND_KEYS = ['breathing.phases.inhale', 'breathing.phases.sip'];
const CONTRACT_KEYS = ['breathing.phases.exhale'];
const HOLD_PHASE_LABEL_KEY = 'breathing.phases.hold';

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

    if (advance.kind === 'tick') {
      phaseAdvanceGuardRef.current = false;
      return;
    }

    const playPhaseCue = () => {
      const o = cueOptsRef.current;
      playPauseBreathPhaseCue({ muted: o.muted, prefersReducedMotion: o.prefersReduced });
    };

    if (advance.kind === 'pattern_complete') {
      const o = cueOptsRef.current;
      playPauseBreathPatternCompleteCue({ muted: o.muted, prefersReducedMotion: o.prefersReduced });
      if (ritualVariantRef.current !== 'brief') {
        onPatternCompleteRef.current?.();
      }
      setCompletedLocal(true);
      hapticFeedback('success');
      setElapsed(0);
      phaseAdvanceGuardRef.current = false;
      return;
    }

    playPhaseCue();
    if (advance.kind === 'next_cycle') {
      setCycle(advance.nextCycle);
      setPhaseIndex(0);
    } else {
      setPhaseIndex(advance.nextPhaseIndex);
    }
    setElapsed(0);
    phaseAdvanceGuardRef.current = false;
  }, [started, completed, elapsed, phaseIndex, cycle, pattern, totalCycles]);

  const progress = currentPhase.duration > 0 ? elapsed / currentPhase.duration : 0;
  const isExpand = EXPAND_KEYS.includes(currentPhase.labelKey);
  const isContract = CONTRACT_KEYS.includes(currentPhase.labelKey);
  const scale = isExpand ? 0.5 + progress * 0.5 : isContract ? 1 - progress * 0.5 : 1;
  const showHoldMandala = currentPhase.labelKey === HOLD_PHASE_LABEL_KEY;
  const holdProgress = showHoldMandala
    ? holdProgressWithinPhase(elapsed, currentPhase.duration)
    : 0;

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
