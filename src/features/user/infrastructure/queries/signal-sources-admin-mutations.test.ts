import { describe, expect, it, vi, beforeEach } from 'vitest';

const insert = vi.fn(async () => ({ error: null }));
const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
const select = vi.fn(async () => ({ data: [{ id: 'src-1' }], error: null }));
const deleteEq = vi.fn(() => ({ select }));
const deleteIn = vi.fn(() => ({ select }));
const del = vi.fn(() => ({ eq: deleteEq, in: deleteIn }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'signal_sources') {
        return { insert, update, delete: del };
      }
      return { update };
    },
  },
}));

describe('signal-sources-admin-mutations', () => {
  beforeEach(() => {
    insert.mockClear();
    update.mockClear();
  });

  it('insertAdminSignalSource writes catalog row', async () => {
    const { insertAdminSignalSource } = await import('./signal-sources-admin-mutations');
    const result = await insertAdminSignalSource({
      name: 'Test Author',
      url: 'https://example.com',
      type: 'blog',
      category: 'signal',
    });
    expect(result.ok).toBe(true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Author',
        category: 'signal',
        demoted_for_live: false,
      }),
    );
  });

  it('setSignalSourceDemotedForLive updates flag', async () => {
    const { setSignalSourceDemotedForLive } = await import('./signal-sources-admin-mutations');
    const result = await setSignalSourceDemotedForLive('src-1', true);
    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith({ demoted_for_live: true });
  });

  it('deleteSignalSourceRow deletes by id', async () => {
    const { deleteSignalSourceRow } = await import('./signal-sources-admin-mutations');
    const result = await deleteSignalSourceRow('src-2');
    expect(result.ok).toBe(true);
    expect(deleteEq).toHaveBeenCalledWith('id', 'src-2');
  });
});
