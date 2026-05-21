import { describe, expect, it } from 'vitest';
import { resolveEffectiveReflectionMessage } from './resolve-effective-reflection-message';

describe('resolve-effective-reflection-message', () => {
  it('prefers trimmed generated reflection over session seed', () => {
    expect(resolveEffectiveReflectionMessage('  Generated  ', 'Seed')).toBe('Generated');
    expect(resolveEffectiveReflectionMessage('   ', 'Seed')).toBe('Seed');
  });
});
