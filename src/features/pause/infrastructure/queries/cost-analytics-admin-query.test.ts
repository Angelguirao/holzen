import { describe, expect, it, vi, beforeEach } from 'vitest';

const limit = vi.fn(async () => ({ data: [], error: null }));
const not = vi.fn(() => ({ limit }));
const gte = vi.fn(() => ({ not }));
const select = vi.fn(() => ({ gte }));
const from = vi.fn(() => ({ select }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from },
}));

describe('cost-analytics-admin-query', () => {
  beforeEach(() => {
    from.mockClear();
    select.mockClear();
    gte.mockClear();
    not.mockClear();
    limit.mockClear();
  });

  it('fetchGenerationAttemptsForPeriod queries generation_attempts', async () => {
    const { fetchGenerationAttemptsForPeriod } = await import('./cost-analytics-admin-query');
    await fetchGenerationAttemptsForPeriod('7d');
    expect(from).toHaveBeenCalledWith('generation_attempts');
  });
});
