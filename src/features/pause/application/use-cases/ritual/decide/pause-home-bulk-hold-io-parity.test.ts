/**
 * Application-layer I/O parity for Home bulk-hold presentation I/O (parity with
 * `pause-archive-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-home-bulk-hold-io.ts`).
 * Mocks `apply-bulk-hold-outcomes` leaf — production Home I/O keeps direct ritual/decide import.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/decide/apply-bulk-hold-outcomes', () => ({
  applyBulkHoldOutcomes: vi.fn(() => Promise.resolve({ status: 'success' as const, count: 0 })),
}));

import { applyBulkHoldOutcomes } from '@/features/pause/application/use-cases/ritual/decide/apply-bulk-hold-outcomes';
import type { BulkHoldPendingPause } from '@/features/pause/domain/bulk-hold';
import {
  homeBulkHoldPauseRepository,
  pauseApplyBulkHoldOutcomes,
  pauseApplyBulkHoldOutcomesWithRepository,
} from '@/features/pause/presentation/home/pause-home-bulk-hold-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

const row = (id: string): BulkHoldPendingPause => ({
  id,
  created_at: new Date().toISOString(),
  context_snapshot: null,
});

/**
 * Application mirror: `presentation/home/pause-home-bulk-hold-io-parity.test.ts`.
 */
describe('pause-home-bulk-hold-io parity (application)', () => {
  it('presentation I/O binds homeBulkHoldPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(homeBulkHoldPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O exports bulk-hold apply wrappers distinct from ritual/decide leaf', () => {
    expect(typeof pauseApplyBulkHoldOutcomes).toBe('function');
    expect(typeof pauseApplyBulkHoldOutcomesWithRepository).toBe('function');
    expect(pauseApplyBulkHoldOutcomes).not.toBe(applyBulkHoldOutcomes);
    expect(pauseApplyBulkHoldOutcomesWithRepository).not.toBe(applyBulkHoldOutcomes);
    expect(pauseApplyBulkHoldOutcomes).not.toBe(pauseApplyBulkHoldOutcomesWithRepository);
  });

  it('pauseApplyBulkHoldOutcomes delegates to apply-bulk-hold-outcomes with default repository', async () => {
    const rows = [row('a')];
    const resolver = () => 'held' as const;

    await pauseApplyBulkHoldOutcomes(rows, resolver);

    expect(applyBulkHoldOutcomes).toHaveBeenCalledWith(
      homeBulkHoldPauseRepository,
      rows,
      resolver,
    );
  });

  it('pauseApplyBulkHoldOutcomesWithRepository forwards injected PauseRepository', async () => {
    const customRepo = { port: 'injected' } as unknown as typeof supabasePauseRepository;
    const rows = [row('b')];
    const resolver = () => 'sold' as const;

    await pauseApplyBulkHoldOutcomesWithRepository(customRepo, rows, resolver);

    expect(applyBulkHoldOutcomes).toHaveBeenCalledWith(customRepo, rows, resolver);
  });
});
