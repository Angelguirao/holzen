import { describe, expect, it, vi } from 'vitest';
import { pauseShiftEmotionFrameHubDone, reflectPauseRepository } from './pause-reflect-hub-io';

const runShiftEmotionFrameHubDoneMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done',
  () => ({
    runShiftEmotionFrameHubDone: runShiftEmotionFrameHubDoneMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

describe('pause-reflect-hub-io', () => {
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
