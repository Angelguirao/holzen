import { describe, expect, it, vi, beforeEach } from 'vitest';

const rpc = vi.fn(async () => ({
  data: { cache_hits: [], costs: [], failures: [], feedback: [] },
  error: null,
}));
const from = vi.fn(() => chainable());

function chainable() {
  const chain: Record<string, unknown> = {};
  const terminal = async () => ({ data: [], error: null });
  for (const method of ['select', 'in', 'order', 'eq']) {
    chain[method] = vi.fn(() => chain);
  }
  chain.limit = vi.fn(terminal);
  chain.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc,
    from,
  },
}));

describe('stats-bundle-admin-query', () => {
  beforeEach(() => {
    rpc.mockClear();
  });

  it('fetchAdminStatsBundle calls get_admin_stats RPC', async () => {
    const { fetchAdminStatsBundle } = await import('./stats-bundle-admin-query');
    const bundle = await fetchAdminStatsBundle();
    expect(rpc).toHaveBeenCalledWith('get_admin_stats');
    expect(bundle.libraryEntries).toEqual([]);
  });

  it('fetchAdminStatsCacheEntries queries companion_cache', async () => {
    const { fetchAdminStatsCacheEntries } = await import('./stats-bundle-admin-query');
    await fetchAdminStatsCacheEntries();
    expect(from).toHaveBeenCalledWith('companion_cache');
  });
});
