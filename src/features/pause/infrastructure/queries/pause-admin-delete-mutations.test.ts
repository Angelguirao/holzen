import { describe, expect, it, vi, beforeEach } from 'vitest';

const select = vi.fn(async () => ({ data: [{ id: 'row-1' }], error: null }));
const eq = vi.fn(() => ({ select }));
const inFn = vi.fn(() => ({ select }));
const del = vi.fn(() => ({ eq, in: inFn }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ delete: del }),
  },
}));

describe('pause-admin-delete-mutations', () => {
  beforeEach(() => {
    del.mockClear();
    eq.mockClear();
    inFn.mockClear();
    select.mockClear();
  });

  it('deleteCompanionCacheRow deletes by id', async () => {
    const { deleteCompanionCacheRow } = await import('./pause-admin-delete-mutations');
    const result = await deleteCompanionCacheRow('cache-1');
    expect(result.ok).toBe(true);
    expect(eq).toHaveBeenCalledWith('id', 'cache-1');
  });

  it('deleteCompanionCacheRowsByIds chunks in calls', async () => {
    const { deleteCompanionCacheRowsByIds } = await import('./pause-admin-delete-mutations');
    const ids = ['a', 'b', 'c'];
    const result = await deleteCompanionCacheRowsByIds(ids, 2);
    expect(result.deleted).toBe(2);
    expect(inFn).toHaveBeenCalledTimes(2);
  });
});
