/**
 * Application-layer I/O parity for archive retrospective decide presentation I/O (parity with
 * `pause-reflect-telemetry-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-archive-io.ts`).
 * Imports `pause-archive-decide-flow` CI umbrella for `.toBe` identity pins only —
 * production archive I/O keeps ritual/decide leaf imports.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'archivePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/decide/log-retrospective-outcome', () => ({
  logRetrospectiveOutcome: vi.fn(() => Promise.resolve({ status: 'ok' as const })),
}));

import { logRetrospectiveOutcome as logRetrospectiveDirect } from '@/features/pause/application/use-cases/ritual/decide/log-retrospective-outcome';
import {
  trackPauseOutcomeRetrospective as trackRetrospectiveDirect,
} from '@/features/pause/application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry';
import {
  logRetrospectiveOutcome as logRetrospectiveFromArchiveDecideFlow,
  trackPauseOutcomeRetrospective,
} from '@/features/pause/application/use-cases/ritual/decide/pause-archive-decide-flow';
import {
  archivePauseRepository,
  pauseArchiveLogRetrospectiveOutcome,
  pauseArchiveLogRetrospectiveOutcomeWithRepository,
  trackPauseOutcomeRetrospective as trackRetrospectiveFromArchiveIo,
} from '@/features/pause/presentation/archive/pause-archive-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/**
 * Application mirror: `presentation/archive/pause-archive-io-parity.test.ts`.
 */
describe('pause-archive-io parity (application)', () => {
  it('presentation I/O archive retrospective telemetry matches archive-decide-flow CI umbrella', () => {
    expect(trackPauseOutcomeRetrospective).toBe(trackRetrospectiveFromArchiveIo);
    expect(trackPauseOutcomeRetrospective).toBe(trackRetrospectiveDirect);
    expect(trackRetrospectiveFromArchiveIo).toBe(trackRetrospectiveDirect);
  });

  it('archive-decide-flow CI umbrella composes the same RPC leaf as presentation I/O', () => {
    expect(logRetrospectiveFromArchiveDecideFlow).toBe(logRetrospectiveDirect);
  });

  it('presentation I/O binds archivePauseRepository to public-rpc supabasePauseRepository', () => {
    expect(archivePauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O exports retrospective RPC wrapper distinct from leaf use case', () => {
    expect(typeof pauseArchiveLogRetrospectiveOutcome).toBe('function');
    expect(typeof pauseArchiveLogRetrospectiveOutcomeWithRepository).toBe('function');
    expect(pauseArchiveLogRetrospectiveOutcome).not.toBe(logRetrospectiveDirect);
    expect(pauseArchiveLogRetrospectiveOutcomeWithRepository).not.toBe(logRetrospectiveDirect);
    expect(pauseArchiveLogRetrospectiveOutcome).not.toBe(pauseArchiveLogRetrospectiveOutcomeWithRepository);
  });

  it('pauseArchiveLogRetrospectiveOutcome delegates to log-retrospective-outcome with default repository', async () => {
    const params = { instanceId: 'inst-archive-app', outcome: 'held' };

    await pauseArchiveLogRetrospectiveOutcome(params);

    expect(logRetrospectiveDirect).toHaveBeenCalledWith(archivePauseRepository, params);
  });

  it('pauseArchiveLogRetrospectiveOutcomeWithRepository forwards injected PauseRepository', async () => {
    const customRepo = { port: 'injected-archive' } as unknown as typeof supabasePauseRepository;
    const params = { instanceId: 'inst-archive-app-custom', outcome: 'sold' };

    await pauseArchiveLogRetrospectiveOutcomeWithRepository(customRepo, params);

    expect(logRetrospectiveDirect).toHaveBeenCalledWith(customRepo, params);
  });

  it('presentation archive I/O telemetry export stays distinct from RPC wrapper', () => {
    expect(trackRetrospectiveFromArchiveIo).not.toBe(pauseArchiveLogRetrospectiveOutcome);
    expect(trackRetrospectiveFromArchiveIo).not.toBe(pauseArchiveLogRetrospectiveOutcomeWithRepository);
    expect(trackRetrospectiveFromArchiveIo).not.toBe(logRetrospectiveDirect);
  });
});
