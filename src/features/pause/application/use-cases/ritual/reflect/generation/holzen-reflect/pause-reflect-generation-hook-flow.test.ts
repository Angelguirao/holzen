import { describe, expect, it } from 'vitest';

import {
  messageFromReflectGenerationResult,
  reflectGenerationPrerequisite,
  reflectGenerationUserErrorMessage,
  resolveEffectiveReflectionCopy,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from './pause-reflect-generation-hook-flow';

describe('pause-reflect-generation-hook-flow', () => {
  it('re-exports holzen-reflect domain helpers and run-reflect-generation', () => {
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof shouldClearReflectGenerationLoading).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof reflectGenerationUserErrorMessage).toBe('function');
    expect(typeof resolveEffectiveReflectionCopy).toBe('function');
    expect(typeof runReflectGeneration).toBe('function');
  });
});
