import { describe, expect, it, vi, beforeEach } from 'vitest';

const limit = vi.fn(async () => ({ data: [], error: null }));
const gte = vi.fn(() => ({ limit }));
const select = vi.fn(() => ({ gte }));
const from = vi.fn(() => ({ select }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from },
}));

describe('provider-health-admin-query', () => {
  beforeEach(() => {
    from.mockClear();
    select.mockClear();
    gte.mockClear();
    limit.mockClear();
  });

  it('fetchProviderHealthStats queries generation_attempts', async () => {
    const { fetchProviderHealthStats } = await import('./provider-health-admin-query');
    const stats = await fetchProviderHealthStats();
    expect(from).toHaveBeenCalledWith('generation_attempts');
    expect(stats.perplexity.state).toBe('insufficient_sample');
    expect(stats.lovable.state).toBe('insufficient_sample');
  });
});
