import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import { runPostPauseEmotionLogIfDirty as runEmotionLogDirect } from '@/features/pause/application/use-cases/ritual/done/post-pause-emotion-log';
import { runPostPauseEmotionLogIfDirty } from '@/features/pause/application/use-cases/ritual/done/pause-ritual-done-flow';
import { supabasePauseRepository } from '@/features/pause/public-rpc';
import {
  reflectPauseRepository,
  runPostPauseEmotionLogIfDirty as runEmotionLogFromDoneIo,
} from './pause-ritual-done-io';

/**
 * Presentation I/O parity (colocated beside `pause-ritual-done-io.ts`).
 * Imports `pause-ritual-done-flow` CI umbrella for `.toBe` identity pins only —
 * production ritual done I/O keeps `post-pause-emotion-log` leaf import.
 */
describe('pause-ritual-done-io parity', () => {
  it('presentation I/O re-exported emotion log matches pause-ritual-done-flow CI umbrella', () => {
    expect(runPostPauseEmotionLogIfDirty).toBe(runEmotionLogFromDoneIo);
    expect(runPostPauseEmotionLogIfDirty).toBe(runEmotionLogDirect);
  });

  it('binds default reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });
});
