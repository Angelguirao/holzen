import { describe, expect, it } from 'vitest';
import { briefStepToPauseScienceStep } from './brief-step-to-pause-science-step';

describe('briefStepToPauseScienceStep', () => {
  it('maps brief steps to deep stepper keys for science sheet', () => {
    expect(briefStepToPauseScienceStep('feel')).toBe('feel');
    expect(briefStepToPauseScienceStep('breath')).toBe('breathe');
    expect(briefStepToPauseScienceStep('integrate')).toBe('reflect');
    expect(briefStepToPauseScienceStep('decide')).toBe('decide');
  });
});
