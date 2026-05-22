import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import { runPostPauseEmotionLogIfDirty as runEmotionLogDirect } from '@/features/pause/application/use-cases/ritual/done/post-pause-emotion-log';
import { runPostPauseEmotionLogIfDirty } from '@/features/pause/application/use-cases/ritual/done/pause-ritual-done-flow';
import {
  reflectPauseRepository,
  runPostPauseEmotionLogIfDirty as runEmotionLogFromDoneIo,
} from '@/features/pause/presentation/ritual/done/pause-ritual-done-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

describe('pause-ritual-done-io parity', () => {
  it('presentation I/O re-exported emotion log matches pause-ritual-done-flow CI umbrella', () => {
    expect(runPostPauseEmotionLogIfDirty).toBe(runEmotionLogFromDoneIo);
    expect(runPostPauseEmotionLogIfDirty).toBe(runEmotionLogDirect);
  });

  it('binds default reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });
});
