import { motion } from 'framer-motion';

/** Matches ritual orb layout; progress ring and hold mandala share this box. */
export const BREATH_ORB_PX = 140;
const BREATH_RING_R = 56;
const BREATH_RING_C = 2 * Math.PI * BREATH_RING_R;

const CX = BREATH_ORB_PX / 2;
const CY = BREATH_ORB_PX / 2;
/** Circumradius for hex vertices (wireframe-adjacent proportions inside 140px artboard). */
const HEX_R = 46;
const INNER_RING_R = 30;
const INNER_LEN = 2 * Math.PI * INNER_RING_R;

/** Normalized windows over holdProgress (0–1); tune with design without touching React state. */
const HOLD_HEX_T0 = 0;
const HOLD_HEX_T1 = 0.38;
const HOLD_INNER_T0 = 0.22;
const HOLD_INNER_T1 = 0.58;
const HOLD_CARD_T0 = 0.42;
const HOLD_CARD_T1 = 0.8;
const HOLD_MARK_T0 = 0.62;
const HOLD_MARK_T1 = 1;

function windowProgress(t: number, t0: number, t1: number): number {
  if (t1 <= t0) return t >= t1 ? 1 : 0;
  return Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
}

function hexPathPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let k = 0; k < 6; k++) {
    const a = (-90 + k * 60) * (Math.PI / 180);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' ')} Z`;
}

/** Perimeter ≈ 6 × edge; edge = circumradius R for regular hex. */
const HEX_PATH_LEN = 6 * HEX_R;

/** Phase progress ring (wireframe-style) around the breathing orb. */
export function BreathPhaseProgressRing({ progress }: { progress: number }) {
  const dashOffset = BREATH_RING_C * (1 - progress);
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
      viewBox={`0 0 ${BREATH_ORB_PX} ${BREATH_ORB_PX}`}
      aria-hidden
    >
      <circle cx={CX} cy={CY} r={BREATH_RING_R} fill="none" className="stroke-border/55" strokeWidth={3} />
      <circle
        cx={CX}
        cy={CY}
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
  const t = holdProgress;
  const wHex = prefersReducedMotion && showHoldMandala ? 1 : windowProgress(t, HOLD_HEX_T0, HOLD_HEX_T1);
  const wInner = prefersReducedMotion && showHoldMandala ? 1 : windowProgress(t, HOLD_INNER_T0, HOLD_INNER_T1);
  const wCard = prefersReducedMotion && showHoldMandala ? 1 : windowProgress(t, HOLD_CARD_T0, HOLD_CARD_T1);
  const wMark = prefersReducedMotion && showHoldMandala ? 1 : windowProgress(t, HOLD_MARK_T0, HOLD_MARK_T1);

  const hexDashOffset = HEX_PATH_LEN * (1 - wHex);
  const innerDashOffset = INNER_LEN * (1 - wInner);

  const hexPath = hexPathPoints(CX, CY, HEX_R);

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
        <svg
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full text-foreground"
          viewBox={`0 0 ${BREATH_ORB_PX} ${BREATH_ORB_PX}`}
          aria-hidden
        >
          <g className="stroke-foreground/75" fill="none" strokeWidth={1.25}>
            <path
              d={hexPath}
              strokeLinejoin="round"
              strokeDasharray={HEX_PATH_LEN}
              strokeDashoffset={hexDashOffset}
              style={{ transition: 'stroke-dashoffset 0.35s ease-out' }}
            />
            <circle
              cx={CX}
              cy={CY}
              r={INNER_RING_R}
              className="stroke-foreground/50"
              strokeDasharray="3 7"
              strokeDashoffset={innerDashOffset}
              opacity={wInner}
              style={{ transition: 'stroke-dashoffset 0.35s ease-out, opacity 0.35s ease-out' }}
            />
          </g>
          <g fill="hsl(var(--foreground))" className="opacity-80">
            {(
              [
                [CX, CY - INNER_RING_R],
                [CX, CY + INNER_RING_R],
                [CX - INNER_RING_R, CY],
                [CX + INNER_RING_R, CY],
              ] as const
            ).map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={2.25}
                opacity={wCard}
                style={{ transition: 'opacity 0.35s ease-out' }}
              />
            ))}
          </g>
          <g
            className="stroke-foreground"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={wMark}
            style={{ transition: 'opacity 0.4s ease-out' }}
          >
            <line x1={CX - 9} y1={CY - 12} x2={CX - 9} y2={CY + 12} />
            <line x1={CX + 9} y1={CY - 12} x2={CX + 9} y2={CY + 12} />
            <line x1={CX - 4} y1={CY} x2={CX + 4} y2={CY} strokeWidth={1.5} />
          </g>
        </svg>
      ) : null}
    </div>
  );
}
