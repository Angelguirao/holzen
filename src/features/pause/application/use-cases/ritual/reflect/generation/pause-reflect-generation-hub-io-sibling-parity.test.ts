import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as hubIo from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import * as generationIo from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';

/**
 * Application sibling parity: generation-io vs hub-io (parity with presentation
 * `pause-reflect-generation-hub-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-generation-hub-flow-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-generation-io-parity.test.ts` ↔
 * `pause-reflect-hub-io-parity.test.ts`.
 */
describe('pause-reflect-generation-io ↔ pause-reflect-hub-io sibling parity (application)', () => {
  it('generation-io and hub-io are distinct presentation I/O surfaces', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof reflectGenerator).toBe('object');

    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseShiftEmotionFrameHubDone' in generationIo).toBe(false);
    expect('pauseShiftEmotionFrameHubDoneWithRepository' in generationIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in generationIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in generationIo).toBe(false);

    expect('runReflectGeneration' in hubIo).toBe(false);
    expect('pauseReflectGeneration' in hubIo).toBe(false);
    expect('reflectGenerationPrerequisite' in hubIo).toBe(false);
    expect('shouldCommitReflectGeneration' in hubIo).toBe(false);
    expect('reflectGenerator' in hubIo).toBe(false);
  });

  it('generation-io exports stay off shift-frame hub done RPC and log bundle', () => {
    expect(runReflectGeneration).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectGeneration).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(reflectGenerationPrerequisite).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(shouldCommitReflectGeneration).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(reflectGenerator).not.toBe(reflectPauseRepository);
    expect(runReflectGeneration).not.toBe(buildShiftEmotionFrameHubLogBundle);
  });

  it('hub-io exports stay off holzen-reflect generation wrappers and domain gates', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(runReflectGeneration);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseReflectGeneration);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(reflectGenerationPrerequisite);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(shouldCommitReflectGeneration);
    expect(reflectPauseRepository).not.toBe(reflectGenerator);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(runReflectGeneration);
  });
});
