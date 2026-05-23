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

import {
  dismissOpenPauseHome,
  messageFromReflectGenerationResult,
  openManualPauseFromHome,
  reflectGenerationPrerequisite,
  reflectGenerationUserErrorMessage,
  resolveEffectiveReflectionCopy,
  resolveReflectGenerationPrefetch,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
  runReflectGeneration,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow';
import * as generationFlow from '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow';
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
} from './pause-reflect-generation-io';
import * as generationIo from './pause-reflect-generation-io';

/**
 * Presentation sibling parity: generation-flow CI umbrella vs generation-io port-bound wrappers.
 * Mirrors application `pause-reflect-generation-flow-io-wrapper-sibling-parity.test.ts`
 * (colocated beside `pause-reflect-generation-io.ts`).
 * Delegation parity: colocated `pause-reflect-generation-io-parity.test.ts`.
 */
describe('pause-reflect-generation-flow ↔ pause-reflect-generation-io wrapper sibling parity (presentation)', () => {
  it('generation-flow CI umbrella and presentation generation-io are distinct anchors', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(typeof runPersistSilentReflectionStub).toBe('function');
    expect(typeof runOpenManualPauseSilentModeAfterCreate).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof reflectGenerator).toBe('object');

    expect('pauseReflectGeneration' in generationFlow).toBe(false);
    expect('reflectGenerator' in generationFlow).toBe(false);
    expect('openManualPauseFromHome' in generationIo).toBe(false);
    expect('dismissOpenPauseHome' in generationIo).toBe(false);
    expect('runPersistSilentReflectionStub' in generationIo).toBe(false);
    expect('runOpenManualPauseSilentModeAfterCreate' in generationIo).toBe(false);
  });

  it('presentation generation-io re-exports stay aligned with generation-flow CI umbrella (shared holzen-reflect helpers)', () => {
    expect(messageFromReflectGenerationResult).toBe(messageFromGenerationIo);
    expect(resolveReflectGenerationPrefetch).toBe(resolvePrefetchFromGenerationIo);
    expect(shouldClearReflectGenerationLoading).toBe(shouldClearLoadingFromGenerationIo);
    expect(shouldCommitReflectGeneration).toBe(shouldCommitFromGenerationIo);
    expect(reflectGenerationPrerequisite).toBe(prerequisiteFromGenerationIo);
    expect(reflectGenerationUserErrorMessage).toBe(userErrorFromGenerationIo);
    expect(resolveEffectiveReflectionCopy).toBe(resolveCopyFromGenerationIo);
    expect(runReflectGeneration).toBe(runReflectGenerationFromGenerationIo);
  });

  it('generation-flow manual-open leaf exports stay off presentation port-bound wrappers', () => {
    expect(openManualPauseFromHome).not.toBe(pauseReflectGeneration);
    expect(dismissOpenPauseHome).not.toBe(pauseReflectGeneration);
    expect(runPersistSilentReflectionStub).not.toBe(reflectGenerator);
    expect(runOpenManualPauseSilentModeAfterCreate).not.toBe(reflectGenerator);
    expect(runReflectGeneration).not.toBe(pauseReflectGeneration);
    expect(messageFromReflectGenerationResult).not.toBe(reflectGenerator);
  });

  it('presentation generation-io wrappers stay off generation-flow-only bindings', () => {
    expect(pauseReflectGeneration).not.toBe(runReflectGeneration);
    expect(pauseReflectGeneration).not.toBe(openManualPauseFromHome);
    expect(pauseReflectGeneration).not.toBe(dismissOpenPauseHome);
    expect(reflectGenerator).not.toBe(runReflectGeneration);
    expect(reflectGenerator).not.toBe(runPersistSilentReflectionStub);
    expect(pauseReflectGeneration).not.toBe(runOpenManualPauseSilentModeAfterCreate);
  });
});
