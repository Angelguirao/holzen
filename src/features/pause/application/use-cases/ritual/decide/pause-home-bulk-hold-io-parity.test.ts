import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'bulkHoldPauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/decide/apply-bulk-hold-outcomes', () => ({
  applyBulkHoldOutcomes: vi.fn(() => Promise.resolve({ status: 'success' as const, count: 0 })),
}));

import { applyBulkHoldOutcomes } from '@/features/pause/application/use-cases/ritual/decide/apply-bulk-hold-outcomes';
import {
  pauseApplyBulkHoldOutcomes,
  pauseApplyBulkHoldOutcomesWithRepository,
} from '@/features/pause/presentation/home/pause-home-bulk-hold-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';
import type { BulkHoldPendingPause } from '@/features/pause/domain/bulk-hold';

const row = (id: string): BulkHoldPendingPause => ({
  id,
  created_at: new Date().toISOString(),
  context_snapshot: null,
});

describe('pause-home-bulk-hold-io parity', () => {
  it('presentation I/O delegates bulk-hold apply to ritual/decide leaf with default repository', async () => {
    const rows = [row('a')];
    const resolver = () => 'held' as const;

    await pauseApplyBulkHoldOutcomes(rows, resolver);

    expect(applyBulkHoldOutcomes).toHaveBeenCalledWith(
      supabasePauseRepository,
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
