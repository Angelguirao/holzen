/** Matches ritual orb layout; progress ring and hold mandala share this box. */
export const BREATH_ORB_PX = 140;

export const BREATH_ORB_CX = BREATH_ORB_PX / 2;
export const BREATH_ORB_CY = BREATH_ORB_PX / 2;

/** Circumradius for hex vertices (wireframe-adjacent proportions inside 140px artboard). */
export const BREATH_ORB_HEX_R = 46;
export const BREATH_ORB_INNER_RING_R = 30;

export const BREATH_RING_R = 56;
export const BREATH_RING_C = 2 * Math.PI * BREATH_RING_R;
export const BREATH_ORB_INNER_LEN = 2 * Math.PI * BREATH_ORB_INNER_RING_R;

/** Perimeter ≈ 6 × edge; edge = circumradius R for regular hex. */
export const BREATH_ORB_HEX_PATH_LEN = 6 * BREATH_ORB_HEX_R;

/** Normalized windows over holdProgress (0–1); tune with design without touching React state. */
const HOLD_HEX_T0 = 0;
const HOLD_HEX_T1 = 0.38;
const HOLD_INNER_T0 = 0.22;
const HOLD_INNER_T1 = 0.58;
const HOLD_CARD_T0 = 0.42;
const HOLD_CARD_T1 = 0.8;
const HOLD_MARK_T0 = 0.62;
const HOLD_MARK_T1 = 1;

export function windowProgress(t: number, t0: number, t1: number): number {
  if (t1 <= t0) return t >= t1 ? 1 : 0;
  return Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
}

export function hexPathPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let k = 0; k < 6; k++) {
    const a = (-90 + k * 60) * (Math.PI / 180);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' ')} Z`;
}

export type HoldMandalaLayerWeights = {
  wHex: number;
  wInner: number;
  wCard: number;
  wMark: number;
  hexDashOffset: number;
  innerDashOffset: number;
  hexPath: string;
};

/** Hold mandala stroke/card/mark opacities and dash offsets from hold progress. */
export function resolveHoldMandalaLayerWeights(input: {
  holdProgress: number;
  prefersReducedMotion: boolean;
  showHoldMandala: boolean;
}): HoldMandalaLayerWeights {
  const { holdProgress, prefersReducedMotion, showHoldMandala } = input;
  const t = holdProgress;
  const instant = prefersReducedMotion && showHoldMandala;

  const wHex = instant ? 1 : windowProgress(t, HOLD_HEX_T0, HOLD_HEX_T1);
  const wInner = instant ? 1 : windowProgress(t, HOLD_INNER_T0, HOLD_INNER_T1);
  const wCard = instant ? 1 : windowProgress(t, HOLD_CARD_T0, HOLD_CARD_T1);
  const wMark = instant ? 1 : windowProgress(t, HOLD_MARK_T0, HOLD_MARK_T1);

  return {
    wHex,
    wInner,
    wCard,
    wMark,
    hexDashOffset: BREATH_ORB_HEX_PATH_LEN * (1 - wHex),
    innerDashOffset: BREATH_ORB_INNER_LEN * (1 - wInner),
    hexPath: hexPathPoints(BREATH_ORB_CX, BREATH_ORB_CY, BREATH_ORB_HEX_R),
  };
}
