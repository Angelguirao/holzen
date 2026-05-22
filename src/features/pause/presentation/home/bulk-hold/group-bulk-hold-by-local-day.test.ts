import { describe, expect, it, vi } from 'vitest';

import type { BulkHoldPendingPause } from '@/features/pause/domain/bulk-hold';

import { groupBulkHoldByLocalDay } from './group-bulk-hold-by-local-day';

describe('groupBulkHoldByLocalDay', () => {
  const t = vi.fn((key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key);

  it('groups items by local day and sorts newest day first', () => {
    const items = [
      { created_at: '2026-05-20T12:00:00.000Z' },
      { created_at: '2026-05-21T08:00:00.000Z' },
      { created_at: '2026-05-21T18:00:00.000Z' },
    ] as BulkHoldPendingPause[];

    const sections = groupBulkHoldByLocalDay(items, 'en-US', t);

    expect(sections).toHaveLength(2);
    expect(sections[0].items).toHaveLength(2);
    expect(sections[1].items).toHaveLength(1);
  });

  it('uses Today label for items created on the current local day', () => {
    const todayIso = new Date().toISOString();
    const sections = groupBulkHoldByLocalDay(
      [{ id: 'today', created_at: todayIso, context_snapshot: null }],
      'en-US',
      t,
    );
    expect(sections[0].label).toBe('Today');
    expect(t).toHaveBeenCalledWith('bulkHold.sectionToday', { defaultValue: 'Today' });
  });
});
