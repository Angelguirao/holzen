import { describe, expect, it } from 'vitest';
import { isPauseReflectGenerationEnabled } from './reflect-generation-enabled';

describe('isPauseReflectGenerationEnabled', () => {
  it('is false for brief ritual', () => {
    expect(isPauseReflectGenerationEnabled('brief', 'reflect')).toBe(false);
  });

  it('is false for deep feel/breathe only', () => {
    expect(isPauseReflectGenerationEnabled('deep', 'feel')).toBe(false);
    expect(isPauseReflectGenerationEnabled('deep', 'breathe')).toBe(false);
  });

  it('is true for deep reflect through decide', () => {
    expect(isPauseReflectGenerationEnabled('deep', 'reflect')).toBe(true);
    expect(isPauseReflectGenerationEnabled('deep', 'frame')).toBe(true);
    expect(isPauseReflectGenerationEnabled('deep', 'breath2')).toBe(true);
    expect(isPauseReflectGenerationEnabled('deep', 'decide')).toBe(true);
  });
});
