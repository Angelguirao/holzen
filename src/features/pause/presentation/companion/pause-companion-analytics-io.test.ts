import { describe, expect, it, vi } from 'vitest';

const runLogCompanionFeedbackVoteMock = vi.hoisted(() => vi.fn());
const runLogCompanionFullviewOpenedMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-analytics-flow',
  () => ({
    runLogCompanionFeedbackVote: runLogCompanionFeedbackVoteMock,
    runLogCompanionFullviewOpened: runLogCompanionFullviewOpenedMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseAnalyticsRepository: { port: 'companionAnalyticsRepository' },
}));

import {
  logCompanionFeedbackVote,
  logCompanionFullviewOpened,
} from './pause-companion-analytics-io';

describe('pause-companion-analytics-io', () => {
  it('routes feedback vote through the default PauseAnalyticsRepository port adapter', async () => {
    runLogCompanionFeedbackVoteMock.mockResolvedValue({ ok: true });

    await logCompanionFeedbackVote({
      userId: 'u-1',
      companionType: 'haiku',
      vote: 'up',
    });

    expect(runLogCompanionFeedbackVoteMock).toHaveBeenCalledWith(
      { port: 'companionAnalyticsRepository' },
      {
        userId: 'u-1',
        companionType: 'haiku',
        vote: 'up',
      },
    );
  });

  it('routes fullview opened through the default PauseAnalyticsRepository port adapter', async () => {
    runLogCompanionFullviewOpenedMock.mockResolvedValue({ ok: true });

    await logCompanionFullviewOpened({
      userId: 'u-1',
      companion: 'signal',
      pauseInstanceId: 'pi-1',
    });

    expect(runLogCompanionFullviewOpenedMock).toHaveBeenCalledWith(
      { port: 'companionAnalyticsRepository' },
      {
        userId: 'u-1',
        companion: 'signal',
        pauseInstanceId: 'pi-1',
      },
    );
  });
});
