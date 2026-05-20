import {
  BREATH_ORB_CX,
  BREATH_ORB_CY,
  BREATH_ORB_HEX_PATH_LEN,
  BREATH_ORB_INNER_LEN,
  BREATH_ORB_INNER_RING_R,
  BREATH_ORB_PX,
  resolveHoldMandalaLayerWeights,
} from '@/screens/pause/lib/breath-orb-geometry';

export type BreathOrbHoldMandalaProps = {
  holdProgress: number;
  prefersReducedMotion: boolean;
};

/** Hold-phase mandala SVG layers (hex, inner ring, card dots, pause marks). */
export function BreathOrbHoldMandala({ holdProgress, prefersReducedMotion }: BreathOrbHoldMandalaProps) {
  const { wHex, wInner, wCard, wMark, hexDashOffset, innerDashOffset, hexPath } =
    resolveHoldMandalaLayerWeights({
      holdProgress,
      prefersReducedMotion,
      showHoldMandala: true,
    });

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full text-foreground"
      viewBox={`0 0 ${BREATH_ORB_PX} ${BREATH_ORB_PX}`}
      aria-hidden
    >
      <g className="stroke-foreground/75" fill="none" strokeWidth={1.25}>
        <path
          d={hexPath}
          strokeLinejoin="round"
          strokeDasharray={BREATH_ORB_HEX_PATH_LEN}
          strokeDashoffset={hexDashOffset}
          style={{ transition: 'stroke-dashoffset 0.35s ease-out' }}
        />
        <circle
          cx={BREATH_ORB_CX}
          cy={BREATH_ORB_CY}
          r={BREATH_ORB_INNER_RING_R}
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
            [BREATH_ORB_CX, BREATH_ORB_CY - BREATH_ORB_INNER_RING_R],
            [BREATH_ORB_CX, BREATH_ORB_CY + BREATH_ORB_INNER_RING_R],
            [BREATH_ORB_CX - BREATH_ORB_INNER_RING_R, BREATH_ORB_CY],
            [BREATH_ORB_CX + BREATH_ORB_INNER_RING_R, BREATH_ORB_CY],
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
        <line x1={BREATH_ORB_CX - 9} y1={BREATH_ORB_CY - 12} x2={BREATH_ORB_CX - 9} y2={BREATH_ORB_CY + 12} />
        <line x1={BREATH_ORB_CX + 9} y1={BREATH_ORB_CY - 12} x2={BREATH_ORB_CX + 9} y2={BREATH_ORB_CY + 12} />
        <line x1={BREATH_ORB_CX - 4} y1={BREATH_ORB_CY} x2={BREATH_ORB_CX + 4} y2={BREATH_ORB_CY} strokeWidth={1.5} />
      </g>
    </svg>
  );
}
