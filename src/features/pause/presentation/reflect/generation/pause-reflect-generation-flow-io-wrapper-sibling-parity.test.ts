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
  openManualPauseFromHome,
  reflectGenerationPrerequisite,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow';
import * as generationFlow from '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow';
import {
  pauseReflectGeneration,
  reflectGenerationPrerequisite as prerequisiteFromGenerationIo,
  reflectGenerator,
  resolveReflectGenerationPrefetch as resolvePrefetchFromGenerationIo,
  runReflectGeneration as runReflectGenerationFromGenerationIo,
} from './pause-reflect-generation-io';
import * as generationIo from './pause-reflect-generation-io';

/**
 * Presentation sibling parity: generation-flow CI umbrella vs generation-io port-bound wrappers.
 * Mirrors application `pause-reflect-generation-flow-io-wrapper-sibling-parity.test.ts`
 * (colocated beside `pause-reflect-generation-flow.ts`).
 * Delegation parity: colocated `pause-reflect-generation-io-parity.test.ts`.
 */
describe('pause-reflect-generation-flow ↔ pause-reflect-generation-io wrapper sibling parity (presentation)', () => {
  it('generation-flow CI umbrella and presentation generation-io are distinct anchors', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof reflectGenerator).toBe('object');

    expect('pauseReflectGeneration' in generationFlow).toBe(false);
    expect('reflectGenerator' in generationFlow).toBe(false);
    expect('openManualPauseFromHome' in generationIo).toBe(false);
    expect('dismissOpenPauseHome' in generationIo).toBe(false);
    expect('runOpenManualPauseSilentModeAfterCreate' in generationIo).toBe(false);
    expect('runPersistSilentReflectionStub' in generationIo).toBe(false);
  });

  it('generation-flow and generation-io share holzen-reflect domain re-exports', () => {
    expect(resolveReflectGenerationPrefetch).toBe(resolvePrefetchFromGenerationIo);
    expect(reflectGenerationPrerequisite).toBe(prerequisiteFromGenerationIo);
    expect(runReflectGeneration).toBe(runReflectGenerationFromGenerationIo);
  });

  it('generation-flow manual-open exports stay off presentation holzen-reflect wrapper', () => {
    expect(openManualPauseFromHome).not.toBe(pauseReflectGeneration);
    expect(dismissOpenPauseHome).not.toBe(pauseReflectGeneration);
    expect(runReflectGeneration).not.toBe(reflectGenerator);
    expect(resolveReflectGenerationPrefetch).not.toBe(reflectGenerator);
  });

  it('presentation generation-io wrapper stays off generation-flow manual-open re-exports', () => {
    expect(pauseReflectGeneration).not.toBe(openManualPauseFromHome);
    expect(pauseReflectGeneration).not.toBe(dismissOpenPauseHome);
    expect(pauseReflectGeneration).not.toBe(runReflectGeneration);
    expect(reflectGenerator).not.toBe(openManualPauseFromHome);
    expect(reflectGenerator).not.toBe(dismissOpenPauseHome);
  });
});
