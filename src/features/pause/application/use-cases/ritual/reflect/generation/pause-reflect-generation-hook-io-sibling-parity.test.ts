import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
  runReflectGeneration as runReflectGenerationFromGenerationFlow,
} from './pause-reflect-generation-flow';
import {
  messageFromReflectGenerationResult as messageFromHookFlow,
  reflectGenerationPrerequisite as prerequisiteFromHookFlow,
  resolveReflectGenerationPrefetch as resolvePrefetchFromHookFlow,
  runReflectGeneration as runReflectGenerationFromHookFlow,
  shouldClearReflectGenerationLoading as shouldClearFromHookFlow,
  shouldCommitReflectGeneration as shouldCommitFromHookFlow,
} from './holzen-reflect/pause-reflect-generation-hook-flow';
import * as generationFlow from './pause-reflect-generation-flow';
import * as hookFlow from './holzen-reflect/pause-reflect-generation-hook-flow';
import * as generationIo from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';

/**
 * Presentation ↔ application sibling parity: generation-io vs hook-flow (parity with
 * `pause-reflect-generation-hook-flow-sibling-parity.test.ts`; complements
 * `pause-reflect-generation-io-parity.test.ts`).
 */
describe('pause-reflect-generation-io ↔ pause-reflect-generation-hook-flow sibling parity', () => {
  it('generation-io and hook-flow are distinct presentation vs holzen-reflect CI surfaces', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof reflectGenerator).toBe('object');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');

    expect('pauseReflectGeneration' in generationIo).toBe(true);
    expect('reflectGenerator' in generationIo).toBe(true);
    expect('openManualPauseFromHome' in generationIo).toBe(false);
    expect('dismissOpenPauseHome' in generationIo).toBe(false);

    expect('runReflectGeneration' in hookFlow).toBe(true);
    expect('openManualPauseFromHome' in hookFlow).toBe(false);
    expect('dismissOpenPauseHome' in hookFlow).toBe(false);
    expect('openManualPauseFromHome' in generationFlow).toBe(true);
    expect('dismissOpenPauseHome' in generationFlow).toBe(true);
  });

  it('presentation generation-io holzen-reflect bindings match hook-flow subcluster', () => {
    expect(runReflectGeneration).toBe(runReflectGenerationFromHookFlow);
    expect(reflectGenerationPrerequisite).toBe(prerequisiteFromHookFlow);
    expect(resolveReflectGenerationPrefetch).toBe(resolvePrefetchFromHookFlow);
    expect(shouldCommitReflectGeneration).toBe(shouldCommitFromHookFlow);
    expect(shouldClearReflectGenerationLoading).toBe(shouldClearFromHookFlow);
    expect(messageFromReflectGenerationResult).toBe(messageFromHookFlow);
    expect(runReflectGenerationFromHookFlow).toBe(runReflectGenerationFromGenerationFlow);
  });

  it('presentation generation-io stays off generation-flow manual-open use cases', () => {
    expect(pauseReflectGeneration).not.toBe(openManualPauseFromHome);
    expect(pauseReflectGeneration).not.toBe(dismissOpenPauseHome);
    expect(runReflectGeneration).not.toBe(openManualPauseFromHome);
    expect(reflectGenerationPrerequisite).not.toBe(dismissOpenPauseHome);
    expect(resolveReflectGenerationPrefetch).not.toBe(openManualPauseFromHome);
    expect(shouldCommitReflectGeneration).not.toBe(dismissOpenPauseHome);
    expect(reflectGenerator).not.toBe(openManualPauseFromHome);
  });

  it('hook-flow subcluster stays off manual-open Home exports on generation umbrella', () => {
    expect(runReflectGenerationFromHookFlow).not.toBe(openManualPauseFromHome);
    expect(runReflectGenerationFromHookFlow).not.toBe(dismissOpenPauseHome);
    expect(prerequisiteFromHookFlow).not.toBe(openManualPauseFromHome);
    expect(messageFromHookFlow).not.toBe(dismissOpenPauseHome);
  });
});
