/**
 * Presentation I/O parity (colocated beside `pause-archive-io.ts`).
 * Imports `pause-archive-decide-flow` CI umbrella for `.toBe` identity pins only —
 * production archive I/O keeps ritual/decide leaf imports.
 * Leaf + flow re-export pins also live in `pause-archive-io.re-exports.test.ts`.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'archivePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/decide/log-retrospective-outcome', () => ({
  logRetrospectiveOutcome: vi.fn(() => Promise.resolve(null)),
}));

import { logRetrospectiveOutcome as logRetrospectiveDirect } from '@/features/pause/application/use-cases/ritual/decide/log-retrospective-outcome';
import {
  logRetrospectiveOutcome as logRetrospectiveFromArchiveDecideFlow,
  trackPauseOutcomeRetrospective,
} from '@/features/pause/application/use-cases/ritual/decide/pause-archive-decide-flow';
import {
  archivePauseRepository,
  pauseArchiveLogRetrospectiveOutcome,
  pauseArchiveLogRetrospectiveOutcomeWithRepository,
  trackPauseOutcomeRetrospective as trackRetrospectiveFromArchiveIo,
} from './pause-archive-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

describe('pause-archive-io parity', () => {
  it('presentation I/O archive retrospective telemetry matches archive-decide-flow CI umbrella', () => {
    expect(trackPauseOutcomeRetrospective).toBe(trackRetrospectiveFromArchiveIo);
  });

  it('archive-decide-flow composes the same retrospective RPC leaf as presentation I/O', () => {
    expect(logRetrospectiveFromArchiveDecideFlow).toBe(logRetrospectiveDirect);
  });

  it('binds default archivePauseRepository to public-rpc supabasePauseRepository', () => {
    expect(archivePauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O exports retrospective RPC wrapper distinct from leaf use case', () => {
    expect(typeof pauseArchiveLogRetrospectiveOutcome).toBe('function');
    expect(typeof pauseArchiveLogRetrospectiveOutcomeWithRepository).toBe('function');
    expect(pauseArchiveLogRetrospectiveOutcome).not.toBe(logRetrospectiveDirect);
  });

  it('pauseArchiveLogRetrospectiveOutcome delegates to log-retrospective-outcome with default repository', async () => {
    const params = { instanceId: 'inst-archive', outcome: 'held' };

    await pauseArchiveLogRetrospectiveOutcome(params);

    expect(logRetrospectiveDirect).toHaveBeenCalledWith(archivePauseRepository, params);
  });

  it('pauseArchiveLogRetrospectiveOutcomeWithRepository delegates with injected repository', async () => {
    const customRepository = { port: 'customArchiveRepository' };
    const params = { instanceId: 'inst-archive-custom', outcome: 'released' };

    await pauseArchiveLogRetrospectiveOutcomeWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      params,
    );

    expect(logRetrospectiveDirect).toHaveBeenCalledWith(customRepository, params);
  });
});
