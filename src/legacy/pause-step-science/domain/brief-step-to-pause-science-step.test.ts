import { describe, it, expect } from 'vitest';
import { briefStepToPauseScienceStep } from './brief-step-to-pause-science-step';

describe('briefStepToPauseScienceStep', () => {
  it('maps brief steps to deep science rows', () => {
    expect(briefStepToPauseScienceStep('feel')).toBe('feel');
    expect(briefStepToPauseScienceStep('breath')).toBe('breathe');
    expect(briefStepToPauseScienceStep('integrate')).toBe('reflect');
    expect(briefStepToPauseScienceStep('decide')).toBe('decide');
  });
});
