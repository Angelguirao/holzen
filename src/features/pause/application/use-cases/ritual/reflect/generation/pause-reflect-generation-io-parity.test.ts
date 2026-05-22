import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

import { messageFromReflectGenerationResult as messageDirect } from '@/features/pause/domain/reflect/generation/message-from-reflect-generation-result';
import { reflectGenerationPrerequisite as prerequisiteDirect } from '@/features/pause/domain/reflect/generation/reflect-generation-prerequisites';
import { reflectGenerationUserErrorMessage as userErrorDirect } from '@/features/pause/domain/reflect/generation/reflect-generation-errors';
import { resolveEffectiveReflectionCopy as resolveCopyDirect } from '@/features/pause/domain/reflect/generation/resolve-effective-reflection-copy';
import {
  resolveReflectGenerationPrefetch as resolvePrefetchDirect,
  shouldClearReflectGenerationLoading as shouldClearLoadingDirect,
  shouldCommitReflectGeneration as shouldCommitDirect,
} from '@/features/pause/domain/reflect/generation/reflect-generation-hook-flow';
import { runReflectGeneration as runReflectGenerationDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation';
import {
  messageFromReflectGenerationResult,
  reflectGenerationPrerequisite,
  reflectGenerationUserErrorMessage,
  resolveEffectiveReflectionCopy,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow';
import {
  messageFromReflectGenerationResult as messageFromGenerationIo,
  reflectGenerationPrerequisite as prerequisiteFromGenerationIo,
  reflectGenerationUserErrorMessage as userErrorFromGenerationIo,
  reflectGenerator,
  resolveEffectiveReflectionCopy as resolveCopyFromGenerationIo,
  resolveReflectGenerationPrefetch as resolvePrefetchFromGenerationIo,
  runReflectGeneration as runReflectGenerationFromGenerationIo,
  shouldClearReflectGenerationLoading as shouldClearLoadingFromGenerationIo,
  shouldCommitReflectGeneration as shouldCommitFromGenerationIo,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';

import { supabaseReflectGenerator } from '@/features/pause/public-rpc';

describe('pause-reflect-generation-io parity', () => {
  it('presentation I/O holzen-reflect exports match generation CI umbrella', () => {
    expect(resolveReflectGenerationPrefetch).toBe(resolvePrefetchFromGenerationIo);
    expect(shouldClearReflectGenerationLoading).toBe(shouldClearLoadingFromGenerationIo);
    expect(shouldCommitReflectGeneration).toBe(shouldCommitFromGenerationIo);
    expect(messageFromReflectGenerationResult).toBe(messageFromGenerationIo);
    expect(reflectGenerationPrerequisite).toBe(prerequisiteFromGenerationIo);
    expect(reflectGenerationUserErrorMessage).toBe(userErrorFromGenerationIo);
    expect(resolveEffectiveReflectionCopy).toBe(resolveCopyFromGenerationIo);
    expect(runReflectGeneration).toBe(runReflectGenerationFromGenerationIo);
  });

  it('generation CI umbrella composes the same domain + holzen-reflect leaf modules as presentation I/O', () => {
    expect(resolveReflectGenerationPrefetch).toBe(resolvePrefetchDirect);
    expect(shouldClearReflectGenerationLoading).toBe(shouldClearLoadingDirect);
    expect(shouldCommitReflectGeneration).toBe(shouldCommitDirect);
    expect(messageFromReflectGenerationResult).toBe(messageDirect);
    expect(reflectGenerationPrerequisite).toBe(prerequisiteDirect);
    expect(reflectGenerationUserErrorMessage).toBe(userErrorDirect);
    expect(resolveEffectiveReflectionCopy).toBe(resolveCopyDirect);
    expect(runReflectGeneration).toBe(runReflectGenerationDirect);
  });

  it('presentation I/O binds reflectGenerator to public-rpc supabaseReflectGenerator', () => {
    expect(reflectGenerator).toBe(supabaseReflectGenerator);
  });
});
