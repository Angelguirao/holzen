import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  applyBriefDepthPickerRitualEntry,
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  reflectPauseRepository as moodReflectPauseRepository,
} from '@/features/pause/presentation/feel/pause-feel-io';
import * as moodIo from '@/features/pause/presentation/feel/pause-feel-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from './pause-reflect-generation-io';
import * as generationIo from './pause-reflect-generation-io';

/**
 * Presentation sibling parity: generation-io vs mood-io (parity with application
 * `pause-reflect-generation-feel-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-generation-feel-flow-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-generation-io-parity.test.ts` ↔
 * `pause-feel-io-parity.test.ts`.
 */
describe('pause-reflect-generation-io ↔ pause-feel-io sibling parity', () => {
  it('generation-io and mood-io are distinct presentation I/O surfaces', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof reflectGenerator).toBe('object');

    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof applyBriefDepthPickerRitualEntry).toBe('function');
    expect(typeof moodReflectPauseRepository).toBe('object');

    expect('pauseInitialEmotionSelect' in generationIo).toBe(false);
    expect('pauseInitialEmotionSkip' in generationIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in generationIo).toBe(false);
    expect('applyBriefDepthPickerRitualEntry' in generationIo).toBe(false);
    expect('reflectPauseRepository' in generationIo).toBe(false);

    expect('runReflectGeneration' in moodIo).toBe(false);
    expect('pauseReflectGeneration' in moodIo).toBe(false);
    expect('reflectGenerationPrerequisite' in moodIo).toBe(false);
    expect('resolveReflectGenerationPrefetch' in moodIo).toBe(false);
    expect('shouldCommitReflectGeneration' in moodIo).toBe(false);
    expect('reflectGenerator' in moodIo).toBe(false);
  });

  it('holzen-reflect generation I/O keeps edge generation off initial-emotion RPC', () => {
    expect(pauseReflectGeneration).not.toBe(pauseInitialEmotionSelect);
    expect(runReflectGeneration).not.toBe(pauseInitialEmotionSkip);
    expect(reflectGenerationPrerequisite).not.toBe(buildFeelTilesMoodLogOptions);
    expect(messageFromReflectGenerationResult).not.toBe(applyBriefDepthPickerRitualEntry);
    expect(resolveReflectGenerationPrefetch).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(shouldCommitReflectGeneration).not.toBe(pauseInitialEmotionSelect);
    expect(reflectGenerator).not.toBe(moodReflectPauseRepository);
  });

  it('mood I/O keeps feel-step RPC wrappers off holzen-reflect generation', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectGeneration);
    expect(pauseInitialEmotionSkip).not.toBe(runReflectGeneration);
    expect(buildFeelTilesMoodLogOptions).not.toBe(reflectGenerationPrerequisite);
    expect(applyBriefDepthPickerRitualEntry).not.toBe(messageFromReflectGenerationResult);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(resolveReflectGenerationPrefetch);
    expect(pauseInitialEmotionSelect).not.toBe(shouldCommitReflectGeneration);
    expect(moodReflectPauseRepository).not.toBe(reflectGenerator);
  });
});
