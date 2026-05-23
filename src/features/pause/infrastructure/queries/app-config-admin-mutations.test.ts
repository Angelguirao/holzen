import { describe, expect, it, vi, beforeEach } from 'vitest';

const upsert = vi.fn(async () => ({ error: null }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ upsert }),
  },
}));

describe('app-config-admin-mutations', () => {
  beforeEach(() => {
    upsert.mockClear();
  });

  it('upsertAppConfigRow writes key/value', async () => {
    const { upsertAppConfigRow } = await import('./app-config-admin-mutations');
    await upsertAppConfigRow('panic_mode', true);
    expect(upsert).toHaveBeenCalledWith(
      { key: 'panic_mode', value: true },
      { onConflict: 'key' },
    );
  });
});
