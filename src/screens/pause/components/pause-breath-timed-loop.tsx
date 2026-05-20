import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BreathOrbVisual } from '@/screens/pause/components/breath-orb-visual';

export type PauseBreathTimedLoopProps = {
  orbScale: number;
  phaseProgress: number;
  showHoldMandala: boolean;
  holdProgress: number;
  prefersReducedMotion: boolean;
  phaseLabelKey: string;
  phaseSecondCountsUp: boolean;
  elapsed: number;
  phaseDuration: number;
  showPhaseHints: boolean;
  triangleKickerLine: string;
  triangleKickerIndex: number;
  hasTriangleKickers: boolean;
  cycle: number;
  totalCycles: number;
  phaseIndex: number;
};

/** Active timed triangle breathing loop (orb, phase label, counter, kickers, round label). */
export function PauseBreathTimedLoop({
  orbScale,
  phaseProgress,
  showHoldMandala,
  holdProgress,
  prefersReducedMotion,
  phaseLabelKey,
  phaseSecondCountsUp,
  elapsed,
  phaseDuration,
  showPhaseHints,
  triangleKickerLine,
  triangleKickerIndex,
  hasTriangleKickers,
  cycle,
  totalCycles,
  phaseIndex,
}: PauseBreathTimedLoopProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center gap-8"
    >
      <BreathOrbVisual
        orbScale={orbScale}
        phaseProgress={phaseProgress}
        showHoldMandala={showHoldMandala}
        holdProgress={holdProgress}
        prefersReducedMotion={prefersReducedMotion}
      />
      <motion.p
        key={`${phaseIndex}-${cycle}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-editorial text-2xl capitalize text-foreground sm:text-3xl"
      >
        {t(phaseLabelKey)}
      </motion.p>
      <p className="font-mono text-3xl tabular-nums text-muted-foreground">
        {phaseSecondCountsUp ? elapsed + 1 : phaseDuration - elapsed}
      </p>
      {showPhaseHints && hasTriangleKickers ? (
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
  );
}
