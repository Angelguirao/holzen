import { describe, expect, it } from 'vitest';
import { resolveEffectiveReflectionCopy } from './resolve-effective-reflection-copy';

describe('resolveEffectiveReflectionCopy', () => {
  it('prefers non-empty session seed', () => {
    expect(resolveEffectiveReflectionCopy('  seed  ', 'artifact')).toBe('seed');
  });

  it('falls back to artifact when seed is empty', () => {
    expect(resolveEffectiveReflectionCopy('', '  persisted  ')).toBe('persisted');
  });

  it('returns empty when both missing', () => {
    expect(resolveEffectiveReflectionCopy('  ', null)).toBe('');
  });
});
