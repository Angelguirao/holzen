import { describe, expect, it, vi, beforeEach } from 'vitest';

const single = vi.fn(async () => ({ data: { id: 'col-1' }, error: null }));
const select = vi.fn(() => ({ single }));
const insert = vi.fn(() => ({ select }));
const eq = vi.fn(async () => ({ error: null }));
const update = vi.fn(() => ({ eq }));
const del = vi.fn(() => ({ eq }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'collections') {
        return { insert, update, delete: del };
      }
      return { insert, delete: del };
    },
  },
}));

describe('library-collections-mutations', () => {
  beforeEach(() => {
    insert.mockClear();
    update.mockClear();
    del.mockClear();
    eq.mockClear();
  });

  it('insertLibraryCollection writes user-owned row', async () => {
    const { insertLibraryCollection } = await import('./library-collections-mutations');
    const row = await insertLibraryCollection('user-1', { name: 'Favorites' });
    expect(row).toEqual({ id: 'col-1' });
    expect(insert).toHaveBeenCalled();
  });

  it('deleteLibraryCollection deletes by id', async () => {
    const { deleteLibraryCollection } = await import('./library-collections-mutations');
    await deleteLibraryCollection('col-9');
    expect(eq).toHaveBeenCalledWith('id', 'col-9');
  });
});
