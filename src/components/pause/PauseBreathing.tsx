import { useState, useEffect, useImperativeHandle, forwardRef, useRef, useLayoutEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FeelStepTile } from '@/components/pause/pause-feel-types';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import {
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
} from '@/lib/pause-breathing-phase-advance';
import { resolveBreathCycleTotal, resolvePauseBreathingPhases, rotatingKickerIndexFromElapsed, secondsIntoTrianglePattern } from '@/lib/pause-breathing-pattern';
import {
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
  resumePauseAudioContext,
} from '@/lib/pause-ritual-audio';

const EXPAND_KEYS = ['breathing.phases.inhale', 'breathing.phases.sip'];
const CONTRACT_KEYS = ['breathing.phases.exhale'];

const BREATH_ORB_PX = 140;
const BREATH_RING_R = 56;
const BREATH_RING_C = 2 * Math.PI * BREATH_RING_R;

/** Phase progress ring (wireframe-style) around the breathing orb. */
function BreathPhaseProgressRing({ progress }: { progress: number }) {
  const dashOffset = BREATH_RING_C * (1 - progress);
  const c = BREATH_ORB_PX / 2;
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
      viewBox={`0 0 ${BREATH_ORB_PX} ${BREATH_ORB_PX}`}
      aria-hidden
    >
      <circle cx={c} cy={c} r={BREATH_RING_R} fill="none" className="stroke-border/55" strokeWidth={3} />
      <circle
        cx={c}
        cy={c}
        r={BREATH_RING_R}
        fill="none"
        className="stroke-foreground/60"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={BREATH_RING_C}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 0.25s linear' }}
      />
    </svg>
  );
}

/** i18n: `breathing.triangleRotatingKickers` — advances every 2s in `PauseBreathing`, not per phase. */
const TRIANGLE_ROTATING_KICKERS_I18N_KEY = 'breathing.triangleRotatingKickers';

export type PauseBreathingHandle = {
  /** Return from the timed breathing loop to the pre-start intro (same step). */
  resetToIntro: () => void;
};

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
}

/** Brief ritual: no post-pattern card; advance as soon as the timed cycles finish. */
function BriefBreathAdvanceToIntegrate({
  onContinue,
  onAdvanceFailed,
}: {
  onContinue: () => void | Promise<unknown>;
  onAdvanceFailed?: () => void;
}) {
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;
  const onAdvanceFailedRef = useRef(onAdvanceFailed);
  onAdvanceFailedRef.current = onAdvanceFailed;
  const firedRef = useRef(false);
  useLayoutEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    void Promise.resolve(onContinueRef.current()).catch(() => {
      firedRef.current = false;
      onAdvanceFailedRef.current?.();
    });
  }, []);
  return null;
}

export const PauseBreathing = forwardRef<PauseBreathingHandle, Props>(function PauseBreathing(
  {
    mantra,
    severity = 'mild',
    ritualVariant,
    breathSegment = 'first',
    feelTile = null,
    onContinueAfterBreath,
    onSkipBreath: _onSkipBreath,
    completed: completedProp,
    onPatternComplete,
    onTimedBreathingChange,
    ritualSoundMuted = false,
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

  const introKicker = t('pause.breathIntroKickerRitual', { defaultValue: 'Breathe' });

  const interstitialTitle =
    breathSegment === 'second'
      ? t('pause.breathInterstitialTitleSecond', { defaultValue: 'You stayed with it' })
      : t('pause.breathInterstitialTitle', { defaultValue: 'You stayed with it' });

  const interstitialBody =
    breathSegment === 'second'
      ? t('pause.breathInterstitialBodySecond', {
          defaultValue: 'When you are ready, continue to your decision.',
        })
      : t('pause.breathInterstitialBody', {
          defaultValue: 'When you are ready, continue into reflection.',
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{introKicker}</p>
            {breathSegment === 'second' ? (
              <>
                <p className={pauseStepLayout.screenTitle}>
                  {t('pause.breathSecondHeadline', { defaultValue: "Let's slow this down again" })}
                </p>
                <p className={pauseStepLayout.screenSubtitle}>
                  {t('pause.breathIntroGuidance', { defaultValue: 'Just follow the rhythm.' })}
                </p>
              </>
            ) : (
              <p className={`${pauseStepLayout.screenTitle} max-w-md`}>
                {t('pause.breathIntroSingle', {
                  defaultValue: "Let's slow this down. Just follow the rhythm.",
                })}
              </p>
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
          </div>
        </>
      ) : !completed ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          <div
            className="relative flex items-center justify-center"
            style={{ width: BREATH_ORB_PX, height: BREATH_ORB_PX }}
          >
            <BreathPhaseProgressRing progress={progress} />
            <motion.div
              className="relative z-[1] rounded-full border-2 border-border/50"
              style={{
                width: 102,
                height: 102,
                background: 'radial-gradient(circle, hsl(var(--nox-color-background-accent) / 0.45) 0%, transparent 70%)',
              }}
              animate={{ scale }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            />
          </div>
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
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-5 text-center"
        >
          <div className="h-20 w-20 rounded-full border border-border/60 bg-muted/40" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('pause.breathYouAreHere', { defaultValue: "You're here" })}
          </p>
          <p className="text-center font-editorial text-2xl text-foreground sm:text-3xl">{interstitialTitle}</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{interstitialBody}</p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <Button
              type="button"
              variant="default"
              size="default"
              className={pauseStepLayout.ritualPrimaryCta}
              onClick={() => {
                hapticFeedback('light');
                onContinueAfterBreath();
              }}
            >
              {t('pause.steps.continue', { defaultValue: 'Continue' })}
            </Button>
          </motion.div>
        </motion.div>
      )}

    </motion.div>
  );
});
