import { describe, expect, it, vi } from 'vitest';
import { pauseReflectOutcomeLog } from './pause-reflect-flows-io';

const runPauseOutcomeLogMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log',
  () => ({
    runPauseOutcomeLog: runPauseOutcomeLogMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

describe('pause-reflect-flows-io', () => {
  it('routes decide outcome log through the default PauseRepository port adapter', async () => {
    runPauseOutcomeLogMock.mockResolvedValue({ status: 'completed' });

    await pauseReflectOutcomeLog({
      pauseInstanceId: 'pi-1',
      decision: 'hold',
    });

    expect(runPauseOutcomeLogMock).toHaveBeenCalledWith(
      { port: 'reflectPauseRepository' },
      { pauseInstanceId: 'pi-1', decision: 'hold' },
    );
  });
});
