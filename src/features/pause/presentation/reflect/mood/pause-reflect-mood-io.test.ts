import { describe, expect, it, vi } from 'vitest';
import {
  isPauseSessionDepthPickerActive,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  reflectPauseRepository,
} from './pause-reflect-mood-io';

const runInitialEmotionSelectMock = vi.hoisted(() => vi.fn());
const runInitialEmotionSkipMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-log-flow',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-log-flow')
    >();
    return {
      ...actual,
      runInitialEmotionSelect: runInitialEmotionSelectMock,
      runInitialEmotionSkip: runInitialEmotionSkipMock,
    };
  },
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

describe('pause-reflect-mood-io', () => {
  it('re-exports depth-picker active gate from mood subcluster flows', () => {
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'session',
        ritualEntry: 'picker',
        hasShellMessage: true,
      }),
    ).toBe(true);
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'session',
        ritualEntry: 'deep',
        hasShellMessage: true,
      }),
    ).toBe(false);
  });

  it('routes initial emotion select through the default PauseRepository port adapter', async () => {
    runInitialEmotionSelectMock.mockResolvedValue({ status: 'deduped', ui: {} });

    await pauseInitialEmotionSelect({
      pauseInstanceId: 'pi-1',
      mood: 'calm',
      intensity: 3,
      lastFeelLogKey: null,
    });

    expect(runInitialEmotionSelectMock).toHaveBeenCalledWith(reflectPauseRepository, {
      pauseInstanceId: 'pi-1',
      mood: 'calm',
      intensity: 3,
      lastFeelLogKey: null,
    });
    expect(reflectPauseRepository).toEqual({ port: 'reflectPauseRepository' });
  });

  it('routes initial emotion skip through the default PauseRepository port adapter', async () => {
    runInitialEmotionSkipMock.mockResolvedValue({
      status: 'synced',
      logKey: 'skip',
      ui: { moodDone: true, feelIntensity: null },
    });

    await pauseInitialEmotionSkip({ pauseInstanceId: 'pi-1' });

    expect(runInitialEmotionSkipMock).toHaveBeenCalledWith(reflectPauseRepository, {
      pauseInstanceId: 'pi-1',
    });
  });
});
