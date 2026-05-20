import { motion } from 'framer-motion';
import {
  pauseStepLayout,
  resumePauseAudioContext,
} from '@/features/pause/public';
import { PauseBreathIntro } from '@/screens/pause/components/pause-breath-intro';
import type { PauseBreathSegment } from '@/screens/pause/components/pause-breath-intro';
import { PauseBreathTimedLoop } from '@/screens/pause/components/pause-breath-timed-loop';
import { PauseBreathingCompletion } from '@/screens/pause/components/pause-breathing-completion';
import type { PauseBreathingPhase, PauseBreathingTimedDisplay } from '@/screens/pause/lib/resolve-pause-breathing-timed-display';

export type PauseBreathingBodyProps = {
  started: boolean;
  completed: boolean;
  breathSegment: PauseBreathSegment;
  mantra: string | null;
  ritualVariant: 'brief' | 'deep' | undefined;
  ritualVar: 'brief' | 'deep';
  prefersReducedMotion: boolean;
  showPhaseHints: boolean;
  phaseSecondCountsUp: boolean;
  currentPhase: PauseBreathingPhase;
  elapsed: number;
  cycle: number;
  phaseIndex: number;
  totalCycles: number;
  timedDisplay: PauseBreathingTimedDisplay;
  onStart: () => void;
  onSkipBreath: () => void | Promise<void>;
  onContinueAfterBreath: () => void;
  onAdvanceFailed: () => void;
  onRepeatDeepFirstBreathPattern?: () => void;
  onRepeatDeepSecondBreathPattern?: () => void;
};

/** Intro, timed loop, or completion surface for `PauseBreathing`. */
export function PauseBreathingBody({
  started,
  completed,
  breathSegment,
  mantra,
  ritualVariant,
  ritualVar,
  prefersReducedMotion,
  showPhaseHints,
  phaseSecondCountsUp,
  currentPhase,
  elapsed,
  cycle,
  phaseIndex,
  totalCycles,
  timedDisplay,
  onStart,
  onSkipBreath,
  onContinueAfterBreath,
  onAdvanceFailed,
  onRepeatDeepFirstBreathPattern,
  onRepeatDeepSecondBreathPattern,
}: PauseBreathingBodyProps) {
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
          prefersReducedMotion={prefersReducedMotion}
          onStart={() => {
            void resumePauseAudioContext();
            onStart();
          }}
          onSkipBreath={onSkipBreath}
        />
      ) : !completed ? (
        <PauseBreathTimedLoop
          orbScale={timedDisplay.orbScale}
          phaseProgress={timedDisplay.phaseProgress}
          showHoldMandala={timedDisplay.showHoldMandala}
          holdProgress={timedDisplay.holdProgress}
          prefersReducedMotion={prefersReducedMotion}
          phaseLabelKey={currentPhase.labelKey}
          phaseSecondCountsUp={phaseSecondCountsUp}
          elapsed={elapsed}
          phaseDuration={currentPhase.duration}
          showPhaseHints={showPhaseHints}
          triangleKickerLine={timedDisplay.triangleKickerLine}
          triangleKickerIndex={timedDisplay.triangleKickerIndex}
          hasTriangleKickers={timedDisplay.hasTriangleKickers}
          cycle={cycle}
          totalCycles={totalCycles}
          phaseIndex={phaseIndex}
        />
      ) : (
        <PauseBreathingCompletion
          ritualVariant={ritualVariant}
          breathSegment={breathSegment}
          prefersReducedMotion={prefersReducedMotion}
          onContinueAfterBreath={onContinueAfterBreath}
          onAdvanceFailed={onAdvanceFailed}
          onRepeatDeepFirstBreathPattern={onRepeatDeepFirstBreathPattern}
          onRepeatDeepSecondBreathPattern={onRepeatDeepSecondBreathPattern}
        />
      )}
    </motion.div>
  );
}
