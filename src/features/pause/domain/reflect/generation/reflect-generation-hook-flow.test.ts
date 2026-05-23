import { describe, expect, it } from 'vitest';
import {
  messageFromReflectGenerationResult,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from './reflect-generation-hook-flow';

describe('reflect-generation-hook-flow', () => {
  it('resolves prefetch branches', () => {
    expect(
      resolveReflectGenerationPrefetch('idle', ''),
    ).toEqual({ kind: 'stop' });
    expect(
      resolveReflectGenerationPrefetch('missing_context', ''),
    ).toEqual({ kind: 'missing_context' });
    expect(
      resolveReflectGenerationPrefetch('ok', '  seeded  '),
    ).toEqual({ kind: 'seed', message: 'seeded' });
    expect(
      resolveReflectGenerationPrefetch('ok', ''),
    ).toEqual({ kind: 'generate' });
  });

  it('guards stale runs and maps results', () => {
    expect(shouldCommitReflectGeneration(2, 2)).toBe(true);
    expect(shouldCommitReflectGeneration(2, 3)).toBe(false);
    expect(shouldClearReflectGenerationLoading(4, 4)).toBe(true);
    expect(shouldClearReflectGenerationLoading(4, 5)).toBe(false);
    expect(
      messageFromReflectGenerationResult({ status: 'generated', message: 'hi' }),
    ).toBe('hi');
    expect(messageFromReflectGenerationResult({ status: 'aborted' })).toBeNull();
  });
});
