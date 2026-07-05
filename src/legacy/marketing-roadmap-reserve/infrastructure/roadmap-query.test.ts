import { describe, expect, it, vi, beforeEach } from 'vitest';

const range = vi.fn(async () => ({ data: [], error: null }));
const order = vi.fn(() => ({ range }));
const select = vi.fn(() => ({ order }));
const from = vi.fn(() => ({ select }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from },
}));

describe('roadmap-query', () => {
  beforeEach(() => {
    from.mockClear();
    select.mockClear();
    order.mockClear();
    range.mockClear();
  });

  it('fetchRoadmapItemsPage queries roadmap_items', async () => {
    const { fetchRoadmapItemsPage } = await import('./roadmap-query');
    await fetchRoadmapItemsPage(0);
    expect(from).toHaveBeenCalledWith('roadmap_items');
  });
});
