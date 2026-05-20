import { useImperativeHandle, forwardRef, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { FeelStepTile } from '@/features/pause/public';
import {
  parseTriangleRotatingKickersI18n,
  resolveBreathCycleTotal,
  resolvePauseBreathingPhases,
} from '@/features/pause/public';
import { usePauseBreathingTimedLoop } from '@/features/pause/public-hooks';
import type { PauseBreathSegment } from '@/screens/pause/components/pause-breath-intro';
import { PauseBreathingBody } from '@/screens/pause/components/pause-breathing-body';
import { resolvePauseBreathingTimedDisplay } from '@/screens/pause/lib/resolve-pause-breathing-timed-display';

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

  const ritualVar: 'brief' | 'deep' = ritualVariant ?? 'deep';
  const phases = useMemo(
    () =>
      resolvePauseBreathingPhases({
        ritualVariant: ritualVar,
        feelTile,
        severity,
      }),
    [ritualVar, feelTile, severity],
  );
  const totalCycles = resolveBreathCycleTotal(ritualVariant, breathSegment);
  const showPhaseHints = ritualVariant === 'brief' || ritualVariant === 'deep';
  /** Triangle UX: seconds within the phase count 1 → duration (same for brief and deep). */
  const phaseSecondCountsUp = true;

  const {
    started,
    setStarted,
    completed,
    setCompletedLocal,
    phaseIndex,
    cycle,
    elapsed,
    currentPhase,
    resetToIntro,
    phaseAdvanceGuardRef,
  } = usePauseBreathingTimedLoop({
    phases,
    totalCycles,
    completedProp,
    ritualVariant,
    ritualSoundMuted,
    prefersReduced: !!prefersReduced,
    onPatternComplete,
    onTimedBreathingChange,
  });

  const triangleRotatingKickers = useMemo(
    (): string[] =>
      parseTriangleRotatingKickersI18n(
        t(TRIANGLE_ROTATING_KICKERS_I18N_KEY, { returnObjects: true }) as unknown,
      ),
    [t],
  );

  const timedDisplay = useMemo(
    () =>
      resolvePauseBreathingTimedDisplay({
        phases,
        currentPhase,
        elapsed,
        cycle,
        phaseIndex,
        triangleRotatingKickers,
      }),
    [phases, currentPhase, elapsed, cycle, phaseIndex, triangleRotatingKickers],
  );

  useImperativeHandle(ref, () => ({ resetToIntro }), [resetToIntro]);

  return (
    <PauseBreathingBody
      started={started}
      completed={completed}
      breathSegment={breathSegment}
      mantra={mantra}
      ritualVariant={ritualVariant}
      ritualVar={ritualVar}
      prefersReducedMotion={!!prefersReduced}
      showPhaseHints={showPhaseHints}
      phaseSecondCountsUp={phaseSecondCountsUp}
      currentPhase={currentPhase}
      elapsed={elapsed}
      cycle={cycle}
      phaseIndex={phaseIndex}
      totalCycles={totalCycles}
      timedDisplay={timedDisplay}
      onStart={() => setStarted(true)}
      onSkipBreath={onSkipBreath}
      onContinueAfterBreath={onContinueAfterBreath}
      onAdvanceFailed={() => {
        setCompletedLocal(false);
        phaseAdvanceGuardRef.current = false;
      }}
      onRepeatDeepFirstBreathPattern={onRepeatDeepFirstBreathPattern}
      onRepeatDeepSecondBreathPattern={onRepeatDeepSecondBreathPattern}
    />
  );
});
