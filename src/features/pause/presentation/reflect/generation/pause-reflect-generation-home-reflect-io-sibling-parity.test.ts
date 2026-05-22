import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  openManualPauseFromHome,
  pauseDismissOpenPauseHomePreview,
  pauseDismissOpenPauseHomePreviewWithRepository,
  pauseHomeManualOpenPorts,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
import * as homeReflectIo from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
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
 * Presentation sibling parity: generation-io vs home-reflect-io (parity with application
 * `pause-reflect-generation-manual-open-flow-sibling-parity.test.ts`).
 */
describe('pause-reflect-generation-io ↔ pause-home-reflect-io sibling parity', () => {
  it('generation-io and home-reflect-io are distinct presentation I/O surfaces', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof reflectGenerator).toBe('object');

    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(typeof runOpenManualPauseSilentModeAfterCreate).toBe('function');
    expect(typeof runPersistSilentReflectionStub).toBe('function');
    expect(typeof pauseDismissOpenPauseHomePreview).toBe('function');
    expect(typeof pauseHomeManualOpenPorts).toBe('object');

    expect('openManualPauseFromHome' in generationIo).toBe(false);
    expect('dismissOpenPauseHome' in generationIo).toBe(false);
    expect('pauseHomeManualOpenPorts' in generationIo).toBe(false);
    expect('pauseDismissOpenPauseHomePreview' in generationIo).toBe(false);
    expect('buildManualPauseOpenParams' in generationIo).toBe(false);

    expect('runReflectGeneration' in homeReflectIo).toBe(false);
    expect('pauseReflectGeneration' in homeReflectIo).toBe(false);
    expect('reflectGenerationPrerequisite' in homeReflectIo).toBe(false);
    expect('shouldCommitReflectGeneration' in homeReflectIo).toBe(false);
    expect('reflectGenerator' in homeReflectIo).toBe(false);
    expect('resolveReflectGenerationPrefetch' in homeReflectIo).toBe(false);
  });

  it('generation-io exports stay off Home manual-open use cases and default ports', () => {
    expect(runReflectGeneration).not.toBe(openManualPauseFromHome);
    expect(pauseReflectGeneration).not.toBe(dismissOpenPauseHome);
    expect(reflectGenerationPrerequisite).not.toBe(runOpenManualPauseSilentModeAfterCreate);
    expect(shouldCommitReflectGeneration).not.toBe(runPersistSilentReflectionStub);
    expect(reflectGenerator).not.toBe(pauseHomeManualOpenPorts);
    expect(messageFromReflectGenerationResult).not.toBe(pauseDismissOpenPauseHomePreview);
    expect(resolveReflectGenerationPrefetch).not.toBe(pauseDismissOpenPauseHomePreviewWithRepository);
    expect(shouldClearReflectGenerationLoading).not.toBe(buildManualPauseOpenParams);
    expect(runReflectGeneration).not.toBe(buildManualPauseMarketContext);
    expect(pauseReflectGeneration).not.toBe(buildManualPauseCreateOrReuseParams);
    expect(reflectGenerationPrerequisite).not.toBe(MANUAL_PAUSE_VOLATILITY_TEMPLATE);
  });

  it('home-reflect-io exports stay off holzen-reflect generation wrappers and domain gates', () => {
    expect(openManualPauseFromHome).not.toBe(runReflectGeneration);
    expect(dismissOpenPauseHome).not.toBe(pauseReflectGeneration);
    expect(runOpenManualPauseSilentModeAfterCreate).not.toBe(reflectGenerationPrerequisite);
    expect(runPersistSilentReflectionStub).not.toBe(shouldCommitReflectGeneration);
    expect(pauseHomeManualOpenPorts).not.toBe(reflectGenerator);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(messageFromReflectGenerationResult);
    expect(pauseDismissOpenPauseHomePreviewWithRepository).not.toBe(resolveReflectGenerationPrefetch);
    expect(buildManualPauseOpenParams).not.toBe(shouldClearReflectGenerationLoading);
    expect(buildManualPauseMarketContext).not.toBe(runReflectGeneration);
    expect(buildManualPauseCreateOrReuseParams).not.toBe(pauseReflectGeneration);
    expect(MANUAL_PAUSE_VOLATILITY_TEMPLATE).not.toBe(reflectGenerationPrerequisite);
  });
});
