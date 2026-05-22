import { describe, expect, it, vi } from 'vitest';
import {
  pausePostPauseEmotionLogIfDirty,
  reflectPauseRepository,
} from './pause-ritual-done-io';

const runPostPauseEmotionLogIfDirtyMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/done/pause-ritual-done-flow',
  () => ({
    runPostPauseEmotionLogIfDirty: runPostPauseEmotionLogIfDirtyMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

describe('pause-ritual-done-io', () => {
  it('routes post-pause emotion log through the default PauseRepository port adapter', async () => {
    runPostPauseEmotionLogIfDirtyMock.mockResolvedValue({ status: 'skipped' });

    await pausePostPauseEmotionLogIfDirty({
      pauseInstanceId: 'pi-1',
      mood: 'calm',
      intensity: 3,
      initialSnapshot: null,
    });

    expect(runPostPauseEmotionLogIfDirtyMock).toHaveBeenCalledWith(reflectPauseRepository, {
      pauseInstanceId: 'pi-1',
      mood: 'calm',
      intensity: 3,
      initialSnapshot: null,
    });
    expect(reflectPauseRepository).toEqual({ port: 'reflectPauseRepository' });
  });
});
