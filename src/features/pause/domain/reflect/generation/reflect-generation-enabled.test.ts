import { describe, expect, it } from 'vitest';
import { isPauseReflectGenerationEnabled } from './reflect-generation-enabled';

describe('reflect-generation-enabled', () => {
  it('gates reflect generation by ritual entry and step', () => {
    expect(isPauseReflectGenerationEnabled('brief', 'reflect')).toBe(false);
    expect(isPauseReflectGenerationEnabled('deep', 'reflect')).toBe(true);
    expect(isPauseReflectGenerationEnabled('deep', 'frame')).toBe(true);
  });
});
