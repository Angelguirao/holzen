import { describe, expect, it } from 'vitest';
import {
  BRIEF_INTEGRATE_RING_CIRC,
  BRIEF_INTEGRATE_SECONDS,
  briefIntegrateRemainingProgress,
  briefIntegrateRingDashOffset,
} from '@/features/pause/application/use-cases/ritual/brief/brief-integrate-timer';

describe('brief-integrate-timer', () => {
  it('briefIntegrateRemainingProgress is zero when done', () => {
    expect(briefIntegrateRemainingProgress(10, true)).toBe(0);
  });

  it('briefIntegrateRemainingProgress scales remaining seconds', () => {
    expect(briefIntegrateRemainingProgress(BRIEF_INTEGRATE_SECONDS / 2, false)).toBe(0.5);
  });

  it('briefIntegrateRingDashOffset fills as progress increases', () => {
    expect(briefIntegrateRingDashOffset(0)).toBe(BRIEF_INTEGRATE_RING_CIRC);
    expect(briefIntegrateRingDashOffset(1)).toBe(0);
  });
});
