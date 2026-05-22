import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation',
  () => ({
    runReflectGeneration: vi.fn(() =>
      Promise.resolve({ status: 'generated' as const, message: 'ok' }),
    ),
  }),
);

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
  pauseReflectGeneration,
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
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';

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

  it('presentation I/O exports holzen-reflect RPC wrapper distinct from leaf use case', () => {
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(pauseReflectGeneration).not.toBe(runReflectGenerationDirect);
    expect(runReflectGeneration).not.toBe(pauseReflectGeneration);
  });

  it('pauseReflectGeneration delegates to run-reflect-generation with default generator', async () => {
    const input = {
      pauseInstanceId: 'inst-gen',
      userId: 'user-gen',
      context: 'btc',
      initialReflectionMessage: '',
      severityAbsPct: 50,
      profile: { display_name: 'Test' },
      signal: new AbortController().signal,
    };

    await pauseReflectGeneration(input);

    expect(runReflectGenerationDirect).toHaveBeenCalledWith(input, supabaseReflectGenerator);
  });

  it('pauseReflectGeneration accepts injected ReflectGenerator port', async () => {
    const customGenerator = { port: 'customReflectGenerator' };
    const input = {
      pauseInstanceId: 'inst-gen-custom',
      userId: 'user-gen-custom',
      context: 'eth',
      initialReflectionMessage: 'seed',
      severityAbsPct: 10,
      profile: {},
      signal: new AbortController().signal,
    };

    await pauseReflectGeneration(input, customGenerator as typeof supabaseReflectGenerator);

    expect(runReflectGenerationDirect).toHaveBeenCalledWith(input, customGenerator);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-telemetry-io-parity.test.ts` (holzen-reflect vs session UI telemetry).
   * Dedicated sibling file: `pause-reflect-generation-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: session reflect telemetry-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectShareTap);
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectWallpaperTap);
    expect(reflectGenerator).not.toBe(trackPauseReflectPostItOpen);
    expect(runReflectGeneration).not.toBe(trackPauseReflectShareTap);
    expect(reflectGenerationPrerequisite).not.toBe(trackPauseReflectWallpaperTap);
    // Reciprocal inline pins: `pause-reflect-telemetry-io-parity.test.ts`.
  });
});
