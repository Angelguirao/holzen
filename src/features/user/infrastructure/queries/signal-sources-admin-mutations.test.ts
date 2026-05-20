import { describe, expect, it, vi, beforeEach } from 'vitest';

const insert = vi.fn(async () => ({ error: null }));
const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'signal_sources') {
        return { insert, update };
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
});
