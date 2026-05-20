import { describe, expect, it } from 'vitest';
import {
  resolveEffectiveReflectionMessage,
  resolveReflectGenerationSeverityAbsPct,
  shouldRunPauseReflectGeneration,
} from './pause-session-reflect-decide-flow';

describe('pause-session-reflect-decide-flow', () => {
  it('resolves reflect severity from market change percent', () => {
    expect(resolveReflectGenerationSeverityAbsPct(-4.2)).toBe(4.2);
    expect(resolveReflectGenerationSeverityAbsPct(null)).toBe(0);
  });

  it('prefers trimmed generated reflection over session seed', () => {
    expect(resolveEffectiveReflectionMessage('  Generated  ', 'Seed')).toBe('Generated');
    expect(resolveEffectiveReflectionMessage('   ', 'Seed')).toBe('Seed');
  });

  it('gates reflect generation by ritual entry and step', () => {
    expect(shouldRunPauseReflectGeneration('brief', 'reflect')).toBe(false);
    expect(shouldRunPauseReflectGeneration('deep', 'reflect')).toBe(true);
    expect(shouldRunPauseReflectGeneration('deep', 'frame')).toBe(true);
  });
});
