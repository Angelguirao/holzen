import { describe, expect, it } from 'vitest';
import {
  resolvePauseBreathSecondLabelVariant,
  viteWantsPauseBreathSecondLabelShift,
} from '@/lib/pause-breath-second-label-variant';

describe('viteWantsPauseBreathSecondLabelShift', () => {
  it('is false for undefined / empty / other strings', () => {
    expect(viteWantsPauseBreathSecondLabelShift(undefined)).toBe(false);
    expect(viteWantsPauseBreathSecondLabelShift('')).toBe(false);
    expect(viteWantsPauseBreathSecondLabelShift('0')).toBe(false);
  });

  it('is true for 1, true, shift', () => {
    expect(viteWantsPauseBreathSecondLabelShift('1')).toBe(true);
    expect(viteWantsPauseBreathSecondLabelShift('true')).toBe(true);
    expect(viteWantsPauseBreathSecondLabelShift('shift')).toBe(true);
  });
});

describe('resolvePauseBreathSecondLabelVariant', () => {
  it('prefers Vite when enabled', () => {
    expect(
      resolvePauseBreathSecondLabelVariant({
        viteWantsShift: true,
        flagReady: false,
        posthogRaw: false,
      }),
    ).toBe('shift');
  });

  it('returns breathe when flag not ready and Vite off', () => {
    expect(
      resolvePauseBreathSecondLabelVariant({
        viteWantsShift: false,
        flagReady: false,
        posthogRaw: true,
      }),
    ).toBe('breathe');
  });

  it('uses PostHog when ready and Vite off', () => {
    expect(
      resolvePauseBreathSecondLabelVariant({
        viteWantsShift: false,
        flagReady: true,
        posthogRaw: true,
      }),
    ).toBe('shift');
    expect(
      resolvePauseBreathSecondLabelVariant({
        viteWantsShift: false,
        flagReady: true,
        posthogRaw: 'shift',
      }),
    ).toBe('shift');
  });

  it('returns breathe when ready but raw is off', () => {
    expect(
      resolvePauseBreathSecondLabelVariant({
        viteWantsShift: false,
        flagReady: true,
        posthogRaw: false,
      }),
    ).toBe('breathe');
  });
});
