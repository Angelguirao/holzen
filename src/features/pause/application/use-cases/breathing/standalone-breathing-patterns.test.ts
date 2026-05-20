import { describe, expect, it } from 'vitest';
import { BOX_BREATH_PHASE_COUNT } from '@/features/pause/application/use-cases/ritual/breathe/breathing-constants';
import {
  STANDALONE_BREATHING_PATTERNS,
  resolveSuggestedStandaloneBreathingPatternIndex,
} from '@/features/pause/application/use-cases/breathing/standalone-breathing-patterns';

describe('standalone-breathing-patterns', () => {
  it('box pattern matches legacy phase count', () => {
    expect(STANDALONE_BREATHING_PATTERNS[0]?.phases.length).toBe(BOX_BREATH_PHASE_COUNT);
  });

  it('suggests calming for high severity', () => {
    expect(resolveSuggestedStandaloneBreathingPatternIndex('high')).toBe(1);
  });

  it('suggests box for mild and moderate', () => {
    expect(resolveSuggestedStandaloneBreathingPatternIndex('mild')).toBe(0);
    expect(resolveSuggestedStandaloneBreathingPatternIndex('moderate')).toBe(0);
  });
});
