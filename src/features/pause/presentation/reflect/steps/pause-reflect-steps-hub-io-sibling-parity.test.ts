import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository as hubReflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as hubIo from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as stepsIo from './pause-reflect-steps-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnceWithRepository,
  reflectPauseRepository as stepsReflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-io';

/**
 * Presentation sibling parity: steps-io vs hub-io (parity with application
 * `pause-reflect-steps-hub-flow-sibling-parity.test.ts` and
 * `pause-reflect-steps-hub-io-sibling-parity.test.ts` under application/steps/;
 * complements reciprocal inline pins on `pause-reflect-steps-io.test.ts` /
 * `pause-reflect-hub-io.test.ts` and `pause-reflect-steps-io-parity.test.ts` /
 * `pause-reflect-hub-io-parity.test.ts`).
 */
describe('pause-reflect-steps-io ↔ pause-reflect-hub-io sibling parity', () => {
  it('steps-io and hub-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof stepsReflectPauseRepository).toBe('object');

    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof hubReflectPauseRepository).toBe('object');

    expect('pauseShiftEmotionFrameHubDone' in stepsIo).toBe(false);
    expect('pauseShiftEmotionFrameHubDoneWithRepository' in stepsIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in stepsIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in stepsIo).toBe(false);
    expect('pauseReflectTagUpdate' in hubIo).toBe(false);
    expect('pauseReflectNoteUpdate' in hubIo).toBe(false);
    expect('pauseReflectFavoriteToggle' in hubIo).toBe(false);
    expect('pauseReflectionStepLogOnce' in hubIo).toBe(false);
    expect('shouldShowFavoriteProHint' in hubIo).toBe(false);
    expect('shouldLogPauseReflectionStep' in hubIo).toBe(false);
  });

  it('step mutation I/O keeps post-it RPC wrappers off shift-frame hub done RPC', () => {
    expect(pauseReflectTagUpdate).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectNoteUpdate).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectionStepLogOnce).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(shouldShowFavoriteProHint).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(shouldLogPauseReflectionStep).not.toBe(resolveShiftFrameHubDonePresentation);
  });

  it('hub I/O keeps shift-frame RPC off step mutations and domain step gates', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectNoteUpdate);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(pauseReflectTagUpdate);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(shouldShowFavoriteProHint);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(shouldLogPauseReflectionStep);
  });
});
