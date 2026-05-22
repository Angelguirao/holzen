import { describe, expect, it, vi } from 'vitest';
import {
  pausePostPauseEmotionLogIfDirty,
  pausePostPauseEmotionLogIfDirtyWithRepository,
  reflectPauseRepository,
} from './pause-ritual-done-io';

const runPostPauseEmotionLogIfDirtyMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/done/post-pause-emotion-log',
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

  it('routes post-pause emotion log through post-pause-emotion-log with injected repository', () => {
    const repository = { kind: 'test' };
    pausePostPauseEmotionLogIfDirtyWithRepository(repository as never, {
      pauseInstanceId: 'inst-2',
      mood: 'anxious',
      intensity: 5,
      initialSnapshot: { mood: 'calm', intensity: 2 },
    });
    expect(runPostPauseEmotionLogIfDirtyMock).toHaveBeenCalledWith(repository, {
      pauseInstanceId: 'inst-2',
      mood: 'anxious',
      intensity: 5,
      initialSnapshot: { mood: 'calm', intensity: 2 },
    });
  });
});
