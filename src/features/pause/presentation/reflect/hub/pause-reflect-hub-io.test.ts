import { describe, expect, it, vi } from 'vitest';
import {
  pauseShiftEmotionFrameHubDone,
  reflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from './pause-reflect-hub-io';

const runShiftEmotionFrameHubDoneMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-flow',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-flow')
    >();
    return {
      ...actual,
      runShiftEmotionFrameHubDone: runShiftEmotionFrameHubDoneMock,
    };
  },
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

describe('pause-reflect-hub-io', () => {
  it('re-exports shift-frame hub flow helpers for presentation conductors', () => {
    expect(
      resolveShiftFrameHubDonePresentation({ status: 'sync_failed' }),
    ).toEqual({ kind: 'abort_sync_failed' });
  });

  it('routes shift frame hub through the default PauseRepository port adapter', async () => {
    runShiftEmotionFrameHubDoneMock.mockResolvedValue({ status: 'advance', logKey: 'k' });

    await pauseShiftEmotionFrameHubDone({
      pauseInstanceId: 'pi-1',
      lastShiftLogKey: null,
    });

    expect(runShiftEmotionFrameHubDoneMock).toHaveBeenCalledWith(reflectPauseRepository, {
      pauseInstanceId: 'pi-1',
      lastShiftLogKey: null,
    });
    expect(reflectPauseRepository).toEqual({ port: 'reflectPauseRepository' });
  });
});
