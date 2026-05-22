import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

import { messageFromReflectGenerationResult as messageDirect } from '@/features/pause/domain/reflect/generation/message-from-reflect-generation-result';
import { reflectGenerationUserErrorMessage as userErrorDirect } from '@/features/pause/domain/reflect/generation/reflect-generation-errors';
import {
  shouldClearReflectGenerationLoading as shouldClearLoadingDirect,
  shouldCommitReflectGeneration as shouldCommitDirect,
} from '@/features/pause/domain/reflect/generation/reflect-generation-run-guards';
import { reflectGenerationPrerequisite as prerequisiteDirect } from '@/features/pause/domain/reflect/generation/reflect-generation-prerequisites';
import { resolveEffectiveReflectionCopy as resolveCopyDirect } from '@/features/pause/domain/reflect/generation/resolve-effective-reflection-copy';
import { resolveReflectGenerationPrefetch as resolvePrefetchDirect } from '@/features/pause/domain/reflect/generation/resolve-reflect-generation-prefetch';
import { supabaseReflectGenerator } from '@/features/pause/public-rpc';

import {
  messageFromReflectGenerationResult,
  reflectGenerationPrerequisite,
  reflectGenerationUserErrorMessage,
  reflectGenerator,
  resolveEffectiveReflectionCopy,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from './pause-reflect-generation-io';

describe('pause-reflect-generation-io re-exports', () => {
  it('re-exports holzen-reflect domain helpers from generation leaf modules', () => {
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof shouldClearReflectGenerationLoading).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof reflectGenerationUserErrorMessage).toBe('function');
    expect(typeof resolveEffectiveReflectionCopy).toBe('function');

    expect(resolveReflectGenerationPrefetch).toBe(resolvePrefetchDirect);
    expect(shouldClearReflectGenerationLoading).toBe(shouldClearLoadingDirect);
    expect(shouldCommitReflectGeneration).toBe(shouldCommitDirect);
    expect(messageFromReflectGenerationResult).toBe(messageDirect);
    expect(reflectGenerationPrerequisite).toBe(prerequisiteDirect);
    expect(reflectGenerationUserErrorMessage).toBe(userErrorDirect);
    expect(resolveEffectiveReflectionCopy).toBe(resolveCopyDirect);
  });

  it('binds default reflectGenerator to public-rpc supabaseReflectGenerator', () => {
    expect(reflectGenerator).toBe(supabaseReflectGenerator);
  });
});
