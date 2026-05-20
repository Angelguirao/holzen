import { describe, expect, it, vi, beforeEach } from 'vitest';

const order2 = vi.fn(async () => ({ data: [], error: null }));
const order1 = vi.fn(() => ({ order: order2 }));
const select = vi.fn(() => ({ order: order1 }));
const from = vi.fn(() => ({ select }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from },
}));

describe('companion-fallbacks-admin-query', () => {
  beforeEach(() => {
    from.mockClear();
    select.mockClear();
    order1.mockClear();
    order2.mockClear();
  });

  it('fetchCompanionFallbackRows queries companion_fallbacks', async () => {
    const { fetchCompanionFallbackRows } = await import('./companion-fallbacks-admin-query');
    await fetchCompanionFallbackRows();
    expect(from).toHaveBeenCalledWith('companion_fallbacks');
  });
});
