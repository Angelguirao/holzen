import { motion } from 'framer-motion';
import { BreathOrbHoldMandala } from '@/screens/pause/components/breath-orb-hold-mandala';
import { BreathPhaseProgressRing } from '@/screens/pause/components/breath-phase-progress-ring';
import { BREATH_ORB_PX } from '@/screens/pause/lib/breath-orb-geometry';

type Props = {
  /** Framer scale for the filled orb (inhale / exhale / 1 on hold). */
  orbScale: number;
  /** 0–1 for the outer progress ring. */
  phaseProgress: number;
  /** When true, draw hold mandala layers driven by `holdProgress`. */
  showHoldMandala: boolean;
  /** 0–1 within the current hold (`holdProgressWithinPhase`). */
  holdProgress: number;
  prefersReducedMotion: boolean;
};

/**
 * Central breath orb + optional hold mandala (per-hold progress).
 * Geometry is SVG so design can later swap paths / timing constants without raster assets.
 */
export function BreathOrbVisual({
  orbScale,
  phaseProgress,
  showHoldMandala,
  holdProgress,
  prefersReducedMotion,
}: Props) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: BREATH_ORB_PX, height: BREATH_ORB_PX }}
    >
      <BreathPhaseProgressRing progress={phaseProgress} />
      <motion.div
        className="relative z-[1] rounded-full border-2 border-border/50"
        style={{
          width: 102,
          height: 102,
          background: 'radial-gradient(circle, hsl(var(--nox-color-background-accent) / 0.45) 0%, transparent 70%)',
        }}
        animate={{ scale: orbScale }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />
      {showHoldMandala ? (
        <BreathOrbHoldMandala holdProgress={holdProgress} prefersReducedMotion={prefersReducedMotion} />
      ) : null}
    </div>
  );
}
