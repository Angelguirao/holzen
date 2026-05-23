import { describe, expect, it } from 'vitest';
import { resolveReflectGenerationSeverityAbsPct } from './reflect-generation-severity-abs-pct';

describe('reflect-generation-severity-abs-pct', () => {
  it('resolves reflect severity from market change percent', () => {
    expect(resolveReflectGenerationSeverityAbsPct(-4.2)).toBe(4.2);
    expect(resolveReflectGenerationSeverityAbsPct(null)).toBe(0);
  });
});
