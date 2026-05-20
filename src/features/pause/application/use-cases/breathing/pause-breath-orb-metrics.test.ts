import { describe, expect, it } from 'vitest';
import {
  PAUSE_BREATH_HOLD_PHASE_LABEL_KEY,
  resolveBreathOrbVisualMetrics,
} from './pause-breath-orb-metrics';

describe('resolveBreathOrbVisualMetrics', () => {
  it('expands orb on inhale progress', () => {
    expect(
      resolveBreathOrbVisualMetrics({
        phaseLabelKey: 'breathing.phases.inhale',
        elapsed: 2,
        phaseDuration: 4,
      }),
    ).toMatchObject({
      orbScale: 0.75,
      phaseProgress: 0.5,
      showHoldMandala: false,
      holdProgress: 0,
    });
  });

  it('contracts orb on exhale progress', () => {
    expect(
      resolveBreathOrbVisualMetrics({
        phaseLabelKey: 'breathing.phases.exhale',
        elapsed: 4,
        phaseDuration: 4,
      }),
    ).toMatchObject({
      orbScale: 0.5,
      phaseProgress: 1,
      showHoldMandala: false,
    });
  });

  it('enables hold mandala progress on hold phase', () => {
    const metrics = resolveBreathOrbVisualMetrics({
      phaseLabelKey: PAUSE_BREATH_HOLD_PHASE_LABEL_KEY,
      elapsed: 2,
      phaseDuration: 4,
    });
    expect(metrics.showHoldMandala).toBe(true);
    expect(metrics.holdProgress).toBeCloseTo(2 / 3);
    expect(metrics.orbScale).toBe(1);
  });
});
