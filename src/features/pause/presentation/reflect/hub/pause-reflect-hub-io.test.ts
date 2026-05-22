import { describe, expect, it, vi } from 'vitest';
import { runShiftEmotionFrameHubDone as runShiftHubDoneDirect } from '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done';
import {
  pauseReflectOutcomeLog,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import {
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from './pause-reflect-hub-io';

const runShiftEmotionFrameHubDoneMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done')
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
  it('re-exports shift-frame hub presentation mapping from domain hub helpers', () => {
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

  it('exports hub RPC wrapper distinct from leaf use case', () => {
    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(pauseShiftEmotionFrameHubDone).not.toBe(runShiftHubDoneDirect);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseInitialEmotionSelect);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseInitialEmotionSkip);
  });

  it('pauseShiftEmotionFrameHubDoneWithRepository forwards injected repository', async () => {
    const customRepo = { port: 'injected-hub' };
    runShiftEmotionFrameHubDoneMock.mockResolvedValue({ status: 'advance', logKey: 'k2' });

    await pauseShiftEmotionFrameHubDoneWithRepository(customRepo as never, {
      pauseInstanceId: 'pi-custom',
      lastShiftLogKey: 'prev',
    });

    expect(runShiftEmotionFrameHubDoneMock).toHaveBeenCalledWith(customRepo, {
      pauseInstanceId: 'pi-custom',
      lastShiftLogKey: 'prev',
    });
  });

  it('sibling cluster: flows-io exports stay distinct from hub-io', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectOutcomeLog);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
  });
});
