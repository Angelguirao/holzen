import {
  BREATH_ORB_CX,
  BREATH_ORB_CY,
  BREATH_ORB_PX,
  BREATH_RING_C,
  BREATH_RING_R,
} from '@/screens/pause/lib/breath-orb-geometry';

/** Phase progress ring (wireframe-style) around the breathing orb. */
export function BreathPhaseProgressRing({ progress }: { progress: number }) {
  const dashOffset = BREATH_RING_C * (1 - progress);
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
      viewBox={`0 0 ${BREATH_ORB_PX} ${BREATH_ORB_PX}`}
      aria-hidden
    >
      <circle cx={BREATH_ORB_CX} cy={BREATH_ORB_CY} r={BREATH_RING_R} fill="none" className="stroke-border/55" strokeWidth={3} />
      <circle
        cx={BREATH_ORB_CX}
        cy={BREATH_ORB_CY}
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
