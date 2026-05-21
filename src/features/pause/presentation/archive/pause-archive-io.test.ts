import { describe, expect, it, vi } from 'vitest';
import {
  pauseArchiveLogRetrospectiveOutcome,
  trackPauseOutcomeRetrospective,
} from './pause-archive-io';

const {
  logRetrospectiveOutcomeMock,
  trackPauseOutcomeRetrospectiveMock,
} = vi.hoisted(() => ({
  logRetrospectiveOutcomeMock: vi.fn().mockResolvedValue(null),
  trackPauseOutcomeRetrospectiveMock: vi.fn(),
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/decide/log-retrospective-outcome',
  () => ({
    logRetrospectiveOutcome: logRetrospectiveOutcomeMock,
  }),
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry',
  () => ({
    trackPauseOutcomeRetrospective: trackPauseOutcomeRetrospectiveMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'archivePauseRepository' },
}));

describe('pause-archive-io', () => {
  it('routes retrospective outcome log through the default PauseRepository port adapter', async () => {
    await pauseArchiveLogRetrospectiveOutcome({ instanceId: 'pi-1', outcome: 'held' });

    expect(logRetrospectiveOutcomeMock).toHaveBeenCalledWith(
      { port: 'archivePauseRepository' },
      { instanceId: 'pi-1', outcome: 'held' },
    );
  });

  it('re-exports retrospective PostHog tracker from ritual/decide', () => {
    trackPauseOutcomeRetrospective({
      pauseInstanceId: 'pi-1',
      outcome: 'released',
    });

    expect(trackPauseOutcomeRetrospectiveMock).toHaveBeenCalledWith({
      pauseInstanceId: 'pi-1',
      outcome: 'released',
    });
  });
});
