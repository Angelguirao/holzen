export const BRIEF_INTEGRATE_SECONDS = 20;

export const BRIEF_INTEGRATE_RING_R = 54;

export const BRIEF_INTEGRATE_RING_CIRC = 2 * Math.PI * BRIEF_INTEGRATE_RING_R;

/** 0–1 progress for the integrate countdown ring (0 when done). */
export function briefIntegrateRemainingProgress(remaining: number, done: boolean): number {
  return done ? 0 : remaining / BRIEF_INTEGRATE_SECONDS;
}

export function briefIntegrateRingDashOffset(progress: number): number {
  return BRIEF_INTEGRATE_RING_CIRC * (1 - progress);
}
