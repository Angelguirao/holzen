import { describe, expect, it, vi } from 'vitest';

const runLogCompanionFeedbackVoteMock = vi.hoisted(() => vi.fn());
const runLogCompanionFullviewOpenedMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-log-companion-feedback-vote',
  () => ({
    runLogCompanionFeedbackVote: runLogCompanionFeedbackVoteMock,
  }),
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-log-companion-fullview-opened',
  () => ({
    runLogCompanionFullviewOpened: runLogCompanionFullviewOpenedMock,
  }),
);

const orchestrationIoStubs = vi.hoisted(() => ({
  pauseLoadCompanionOrchestrateSession: vi.fn(),
  pauseToggleCompanionLibraryFavorite: vi.fn(),
  nextExpandedWithLazyFetch: vi.fn(),
  invalidateCompanionUiCompletionQuery: vi.fn(),
}));

vi.mock('./pause-companion-orchestration-io', () => orchestrationIoStubs);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseAnalyticsRepository: { port: 'companionAnalyticsRepository' },
}));

import {
  logCompanionFeedbackVote,
  logCompanionFullviewOpened,
} from './pause-companion-analytics-io';

const {
  pauseLoadCompanionOrchestrateSession,
  pauseToggleCompanionLibraryFavorite,
  nextExpandedWithLazyFetch,
  invalidateCompanionUiCompletionQuery,
} = orchestrationIoStubs;

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

  it('sibling cluster: orchestration-io exports stay distinct from analytics-io', () => {
    expect(logCompanionFeedbackVote).not.toBe(pauseLoadCompanionOrchestrateSession);
    expect(logCompanionFullviewOpened).not.toBe(pauseToggleCompanionLibraryFavorite);
    expect(logCompanionFeedbackVote).not.toBe(nextExpandedWithLazyFetch);
    expect(logCompanionFullviewOpened).not.toBe(invalidateCompanionUiCompletionQuery);
    // Full cross-I/O pins: `pause-companion-analytics-orchestration-io-sibling-parity.test.ts`.
  });
});
