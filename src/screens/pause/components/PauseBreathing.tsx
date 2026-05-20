import { useState, useEffect, useImperativeHandle, forwardRef, useRef, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, RefreshCw, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FeelStepTile } from '@/features/pause/public';
import { pauseStepLayout } from '@/features/pause/public';
import { Button } from '@/components/ui/button';
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
import { BreathOrbVisual } from '@/screens/pause/components/breath-orb-visual';

const EXPAND_KEYS = ['breathing.phases.inhale', 'breathing.phases.sip'];
const CONTRACT_KEYS = ['breathing.phases.exhale'];
const HOLD_PHASE_LABEL_KEY = 'breathing.phases.hold';

/** i18n: `breathing.triangleRotatingKickers` — advances every 2s in `PauseBreathing`, not per phase. */
const TRIANGLE_ROTATING_KICKERS_I18N_KEY = 'breathing.triangleRotatingKickers';

export type { PauseBreathingHandle } from '@/features/pause/public';
import type { PauseBreathingHandle } from '@/features/pause/public';

export type PauseBreathSegment = 'first' | 'second';

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

  const introKicker = t('pause.breathIntroKickerRitual', { defaultValue: 'Breathe' });

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {!started ? (
        <>
          <motion.div
            className="h-24 w-24 rounded-full border border-border/10"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
            }}
            animate={prefersReduced ? {} : { scale: [1, 1.12, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            {breathSegment === 'second' ? null : (
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{introKicker}</p>
            )}
            {breathSegment === 'second' ? (
              <>
                <p className={pauseStepLayout.screenTitle}>
                  {t('pause.breathSecondHeadline', { defaultValue: 'Just two more breaths' })}
                </p>
                <div className={`${pauseStepLayout.screenSubtitle} flex flex-col gap-0`}>
                  <p>{t('pause.breathSecondSubline1', { defaultValue: 'Decisions land differently' })}</p>
                  <p>{t('pause.breathSecondSubline2', { defaultValue: 'when the body is here.' })}</p>
                </div>
              </>
            ) : (
              <>
                <p className={`${pauseStepLayout.screenTitle} max-w-md`}>
                  {t('pause.breathIntroSingle', {
                    defaultValue: "Let's slow this down. Just follow the rhythm.",
                  })}
                </p>
              </>
            )}
            {breathSegment === 'first' && mantra && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 1 }}
                className="max-w-sm text-sm italic leading-relaxed text-muted-foreground"
              >
                {`"${mantra}"`}
              </motion.p>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <Button
                type="button"
                variant="outline"
                size="default"
                className={pauseStepLayout.ritualPrimaryOutlineCta}
                onClick={() => {
                  hapticFeedback('light');
                  void resumePauseAudioContext();
                  setStarted(true);
                }}
              >
                {t('pause.breathStartCta', { defaultValue: 'Start' })}
                <Play className="h-4 w-4 shrink-0 fill-current" aria-hidden />
              </Button>
            </motion.div>
            {ritualVar === 'deep' && breathSegment === 'second' ? (
              <Button
                type="button"
                variant="ghost"
                className={`${pauseStepLayout.textContinue} font-medium`}
                onClick={() => {
                  hapticFeedback('light');
                  void onSkipBreath();
                }}
              >
                {t('pause.breathSkipToDecide', { defaultValue: 'Skip to decide' })}
              </Button>
            ) : null}
          </div>
        </>
      ) : !completed ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          <BreathOrbVisual
            orbScale={scale}
            phaseProgress={progress}
            showHoldMandala={showHoldMandala}
            holdProgress={holdProgress}
            prefersReducedMotion={!!prefersReduced}
          />
          <motion.p
            key={`${phaseIndex}-${cycle}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-editorial text-2xl capitalize text-foreground sm:text-3xl"
          >
            {t(currentPhase.labelKey)}
          </motion.p>
          <p className="font-mono text-3xl tabular-nums text-muted-foreground">
            {phaseSecondCountsUp ? elapsed + 1 : currentPhase.duration - elapsed}
          </p>
          {showPhaseHints && triangleRotatingKickers.length > 0 ? (
            <motion.p
              key={`triangle-kicker-${triangleKickerIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="max-w-xs px-2 text-center text-xs italic leading-snug text-muted-foreground"
            >
              {triangleKickerLine}
            </motion.p>
          ) : null}
          <p className="text-base italic text-muted-foreground">
            {t('pause.breathRoundLabel', {
              current: cycle + 1,
              total: totalCycles,
              defaultValue: 'Round {{current}}/{{total}}',
            })}
          </p>
        </motion.div>
      ) : ritualVariant === 'brief' ? (
        <BriefBreathAdvanceToIntegrate
          onContinue={onContinueAfterBreath}
          onAdvanceFailed={() => {
            setCompletedLocal(false);
            phaseAdvanceGuardRef.current = false;
          }}
        />
      ) : ritualVariant === 'deep' && breathSegment === 'first' ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex max-w-md flex-col items-center gap-6 px-2 text-center"
        >
          <p className={pauseStepLayout.screenTitle}>
            {t('pause.deep.breathFirstInterstitialTitle', { defaultValue: 'Three breaths' })}
          </p>
          <p className={`${pauseStepLayout.screenSubtitle} max-w-sm`}>
            {t('pause.deep.breathFirstInterstitialBody', { defaultValue: "You've arrived" })}
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-1 sm:gap-6"
          >
            {onRepeatDeepFirstBreathPattern ? (
              <Button
                type="button"
                variant="ghost"
                className="gap-2 font-semibold text-primary hover:bg-primary/5 hover:text-primary"
                onClick={() => {
                  hapticFeedback('light');
                  onRepeatDeepFirstBreathPattern();
                }}
              >
                <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                {t('pause.deep.breathFirstRepeatCta', { defaultValue: 'Three more' })}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="default"
              className={pauseStepLayout.ritualPrimaryOutlineCta}
              onClick={() => {
                hapticFeedback('light');
                onContinueAfterBreath();
              }}
            >
              {t('pause.steps.continue', { defaultValue: 'Continue' })}
              <ChevronRight className="ml-1 h-4 w-4 shrink-0" aria-hidden />
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex max-w-md flex-col items-center gap-6 px-2 text-center"
        >
          <motion.div
            className="flex shrink-0 items-center justify-center"
            animate={prefersReduced ? {} : { scale: [1, 1.04, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BreathOrbVisual
              orbScale={1}
              phaseProgress={1}
              showHoldMandala
              holdProgress={1}
              prefersReducedMotion={!!prefersReduced}
            />
          </motion.div>
          <p className={pauseStepLayout.screenTitle}>
            {t('pause.deep.breathSecondInterstitialTitle', { defaultValue: 'You already know' })}
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-1 sm:gap-6"
          >
            {onRepeatDeepSecondBreathPattern ? (
              <Button
                type="button"
                variant="ghost"
                className="gap-2 font-semibold text-primary hover:bg-primary/5 hover:text-primary"
                onClick={() => {
                  hapticFeedback('light');
                  onRepeatDeepSecondBreathPattern();
                }}
              >
                <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                {t('pause.deep.breathSecondRepeatCta', { defaultValue: 'Three more' })}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="default"
              className={pauseStepLayout.ritualPrimaryOutlineCta}
              onClick={() => {
                hapticFeedback('light');
                onContinueAfterBreath();
              }}
            >
              {t('pause.steps.continue', { defaultValue: 'Continue' })}
              <ChevronRight className="ml-1 h-4 w-4 shrink-0" aria-hidden />
            </Button>
          </motion.div>
        </motion.div>
      )}

    </motion.div>
  );
});
