import { describe, expect, it } from 'vitest';
import {
  resolveHoldMandalaLayerWeights,
  windowProgress,
} from '@/screens/pause/lib/breath-orb-geometry';

describe('breath-orb-geometry', () => {
  it('windowProgress clamps to 0–1 across the window', () => {
    expect(windowProgress(0, 0.2, 0.8)).toBe(0);
    expect(windowProgress(0.5, 0.2, 0.8)).toBeCloseTo(0.5);
    expect(windowProgress(1, 0.2, 0.8)).toBe(1);
  });

  it('resolveHoldMandalaLayerWeights uses full weights when reduced motion on hold', () => {
    const w = resolveHoldMandalaLayerWeights({
      holdProgress: 0,
      prefersReducedMotion: true,
      showHoldMandala: true,
    });
    expect(w.wHex).toBe(1);
    expect(w.wMark).toBe(1);
    expect(w.hexDashOffset).toBe(0);
  });
});
