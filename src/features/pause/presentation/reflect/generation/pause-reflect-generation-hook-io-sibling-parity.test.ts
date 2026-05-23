import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

import { runReflectGeneration as runReflectGenerationLeaf } from '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation';
import { messageFromReflectGenerationResult as messageFromDomain } from '@/features/pause/domain/reflect/generation/message-from-reflect-generation-result';
import { reflectGenerationPrerequisite as prerequisiteFromDomain } from '@/features/pause/domain/reflect/generation/reflect-generation-prerequisites';
import {
  resolveReflectGenerationPrefetch as resolvePrefetchFromDomain,
  type ReflectGenerationPrefetch,
} from '@/features/pause/domain/reflect/generation/resolve-reflect-generation-prefetch';
import {
  shouldClearReflectGenerationLoading as shouldClearFromDomain,
  shouldCommitReflectGeneration as shouldCommitFromDomain,
} from '@/features/pause/domain/reflect/generation/reflect-generation-run-guards';
import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from './pause-reflect-generation-io';
import * as generationIo from './pause-reflect-generation-io';

/**
 * Presentation sibling parity: generation-io holzen-reflect hook leaf bindings (parity with
 * application `pause-reflect-generation-hook-io-sibling-parity.test.ts` ↔ hook-flow CI anchor;
 * complements `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts` and reciprocal
 * inline pins on `pause-reflect-generation-io.test.ts`). Presentation tests import domain leaves
 * + `run-reflect-generation` only — not flow umbrellas.
 */
describe('pause-reflect-generation-io ↔ holzen-reflect hook leaf sibling parity', () => {
  it('generation-io re-exports holzen-reflect domain hook leaves and runReflectGeneration sibling', () => {
    const prefetch: ReflectGenerationPrefetch = { kind: 'stop' };
    expect(resolveReflectGenerationPrefetch).toBe(resolvePrefetchFromDomain);
    expect(shouldCommitReflectGeneration).toBe(shouldCommitFromDomain);
    expect(shouldClearReflectGenerationLoading).toBe(shouldClearFromDomain);
    expect(messageFromReflectGenerationResult).toBe(messageFromDomain);
    expect(reflectGenerationPrerequisite).toBe(prerequisiteFromDomain);
    expect(runReflectGeneration).toBe(runReflectGenerationLeaf);
    expect(prefetch).toEqual({ kind: 'stop' });
  });

  it('generation-io wrapper and port stay off manual-open Home exports', () => {
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof reflectGenerator).toBe('object');
    expect('openManualPauseFromHome' in generationIo).toBe(false);
    expect('dismissOpenPauseHome' in generationIo).toBe(false);

    expect(pauseReflectGeneration).not.toBe(openManualPauseFromHome);
    expect(pauseReflectGeneration).not.toBe(dismissOpenPauseHome);
    expect(runReflectGeneration).not.toBe(openManualPauseFromHome);
    expect(reflectGenerationPrerequisite).not.toBe(dismissOpenPauseHome);
    expect(reflectGenerator).not.toBe(openManualPauseFromHome);
  });
});
