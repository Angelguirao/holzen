import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyBulkHoldOutcomes } from '@/features/pause/application/use-cases/home/bulk-hold/apply-bulk-hold-outcomes';
import type { BulkHoldPendingPause } from '@/features/pause/domain/bulk-hold';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

const row = (id: string): BulkHoldPendingPause => ({
  id,
  created_at: new Date().toISOString(),
  context_snapshot: null,
});

function mockRepository(logStep: PauseRepository['logStep']): PauseRepository {
  return {
    createOrReuse: vi.fn(),
    adoptPendingOffer: vi.fn(),
    declinePendingOffer: vi.fn(),
    logStep,
    logCompanion: vi.fn(),
    dismissCurrent: vi.fn(),
  };
}

describe('applyBulkHoldOutcomes', () => {
  let logStep: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logStep = vi.fn();
  });

  it('returns success when all RPCs resolve', async () => {
    logStep.mockResolvedValue('expired');
    const r = await applyBulkHoldOutcomes(mockRepository(logStep), [row('a'), row('b')], () => 'held');
    expect(r).toEqual({ status: 'success', count: 2 });
  });

  it('returns failed when all reject', async () => {
    logStep.mockRejectedValue(new Error('nope'));
    const r = await applyBulkHoldOutcomes(mockRepository(logStep), [row('a')], () => 'held');
    expect(r).toEqual({ status: 'failed' });
  });

  it('returns partial when some fail', async () => {
    logStep.mockImplementation(async ({ instanceId }) => {
      if (instanceId === 'bad') throw new Error('nope');
      return 'expired';
    });
    const r = await applyBulkHoldOutcomes(
      mockRepository(logStep),
      [row('ok'), row('bad')],
      () => 'held',
    );
    expect(r.status).toBe('partial');
    if (r.status === 'partial') {
      expect(r.failedRows.map((x) => x.id)).toEqual(['bad']);
    }
  });
});
