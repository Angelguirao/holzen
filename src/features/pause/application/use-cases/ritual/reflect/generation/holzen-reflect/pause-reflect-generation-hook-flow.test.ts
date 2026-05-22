import { describe, expect, it } from 'vitest';

import { reflectGenerationUserErrorMessage } from '@/features/pause/domain/reflect/generation/reflect-generation-errors';
import {
  messageFromReflectGenerationResult,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from '@/features/pause/domain/reflect/generation/reflect-generation-hook-flow';
import { reflectGenerationPrerequisite } from '@/features/pause/domain/reflect/generation/reflect-generation-prerequisites';
import { resolveEffectiveReflectionCopy } from '@/features/pause/domain/reflect/generation/resolve-effective-reflection-copy';

import {
  messageFromReflectGenerationResult as messageFromResultFromGenerationFlow,
  reflectGenerationPrerequisite as prerequisiteFromGenerationFlow,
  reflectGenerationUserErrorMessage as userErrorFromGenerationFlow,
  resolveEffectiveReflectionCopy as resolveCopyFromGenerationFlow,
  resolveReflectGenerationPrefetch as resolvePrefetchFromGenerationFlow,
  runReflectGeneration as runReflectGenerationFromGenerationFlow,
  shouldClearReflectGenerationLoading as shouldClearLoadingFromGenerationFlow,
  shouldCommitReflectGeneration as shouldCommitFromGenerationFlow,
} from '../pause-reflect-generation-flow';
import {
  messageFromReflectGenerationResult as messageFromResultFromFlow,
  reflectGenerationPrerequisite as prerequisiteFromFlow,
  reflectGenerationUserErrorMessage as userErrorFromFlow,
  resolveEffectiveReflectionCopy as resolveCopyFromFlow,
  resolveReflectGenerationPrefetch as resolvePrefetchFromFlow,
  runReflectGeneration,
  shouldClearReflectGenerationLoading as shouldClearLoadingFromFlow,
  shouldCommitReflectGeneration as shouldCommitFromFlow,
} from './pause-reflect-generation-hook-flow';
import { runReflectGeneration as runReflectGenerationDirect } from './run-reflect-generation';

describe('pause-reflect-generation-hook-flow', () => {
  it('re-exports holzen-reflect domain helpers and run-reflect-generation', () => {
    expect(typeof resolvePrefetchFromFlow).toBe('function');
    expect(typeof shouldClearLoadingFromFlow).toBe('function');
    expect(typeof shouldCommitFromFlow).toBe('function');
    expect(typeof messageFromResultFromFlow).toBe('function');
    expect(typeof prerequisiteFromFlow).toBe('function');
    expect(typeof userErrorFromFlow).toBe('function');
    expect(typeof resolveCopyFromFlow).toBe('function');
    expect(typeof runReflectGeneration).toBe('function');

    expect(resolvePrefetchFromFlow).toBe(resolveReflectGenerationPrefetch);
    expect(shouldClearLoadingFromFlow).toBe(shouldClearReflectGenerationLoading);
    expect(shouldCommitFromFlow).toBe(shouldCommitReflectGeneration);
    expect(messageFromResultFromFlow).toBe(messageFromReflectGenerationResult);
    expect(prerequisiteFromFlow).toBe(reflectGenerationPrerequisite);
    expect(userErrorFromFlow).toBe(reflectGenerationUserErrorMessage);
    expect(resolveCopyFromFlow).toBe(resolveEffectiveReflectionCopy);
    expect(runReflectGeneration).toBe(runReflectGenerationDirect);
  });

  it('holzen-reflect hook subcluster bindings match generation presentation umbrella (leaf parity)', () => {
    expect(resolvePrefetchFromFlow).toBe(resolvePrefetchFromGenerationFlow);
    expect(shouldClearLoadingFromFlow).toBe(shouldClearLoadingFromGenerationFlow);
    expect(shouldCommitFromFlow).toBe(shouldCommitFromGenerationFlow);
    expect(messageFromResultFromFlow).toBe(messageFromResultFromGenerationFlow);
    expect(prerequisiteFromFlow).toBe(prerequisiteFromGenerationFlow);
    expect(userErrorFromFlow).toBe(userErrorFromGenerationFlow);
    expect(resolveCopyFromFlow).toBe(resolveCopyFromGenerationFlow);
    expect(runReflectGeneration).toBe(runReflectGenerationFromGenerationFlow);
  });
});
