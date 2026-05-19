import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyBulkHoldOutcomes } from '@/features/pause/application/use-cases/apply-bulk-hold-outcomes';
import type { BulkHoldPendingPause } from '@/features/pause/public';

vi.mock('@/features/pause/infrastructure/pause-rpc-client', () => ({
  pauseLogStep: vi.fn(),
}));

import { pauseLogStep } from '@/features/pause/infrastructure/pause-rpc-client';

const row = (id: string): BulkHoldPendingPause => ({
  id,
  created_at: new Date().toISOString(),
  context_snapshot: null,
});

beforeEach(() => {
  vi.mocked(pauseLogStep).mockReset();
});

describe('applyBulkHoldOutcomes', () => {
  it('returns success when all RPCs resolve', async () => {
    vi.mocked(pauseLogStep).mockResolvedValue('expired' as never);
    const r = await applyBulkHoldOutcomes([row('a'), row('b')], () => 'held');
    expect(r).toEqual({ status: 'success', count: 2 });
  });

  it('returns failed when all reject', async () => {
    vi.mocked(pauseLogStep).mockRejectedValue(new Error('nope'));
    const r = await applyBulkHoldOutcomes([row('a')], () => 'held');
    expect(r).toEqual({ status: 'failed' });
  });

  it('returns partial when some fail', async () => {
    vi.mocked(pauseLogStep).mockImplementation(async ({ instanceId }) => {
      if (instanceId === 'bad') throw new Error('nope');
      return 'expired' as never;
    });
    const r = await applyBulkHoldOutcomes([row('ok'), row('bad')], () => 'held');
    expect(r.status).toBe('partial');
    if (r.status === 'partial') {
      expect(r.failedRows.map((x) => x.id)).toEqual(['bad']);
    }
  });
});
