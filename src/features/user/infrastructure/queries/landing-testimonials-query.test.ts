import { describe, expect, it, vi, beforeEach } from 'vitest';

const limit = vi.fn(async () => ({ data: [{ id: 't1', display_name: 'A', quote: 'Q' }], error: null }));
const order = vi.fn(() => ({ limit }));
const eq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from },
}));

describe('landing-testimonials-query', () => {
  beforeEach(() => {
    from.mockClear();
    eq.mockClear();
  });

  it('fetchLandingTestimonials queries approved testimonials', async () => {
    const { fetchLandingTestimonials } = await import('./landing-testimonials-query');
    const rows = await fetchLandingTestimonials();
    expect(from).toHaveBeenCalledWith('testimonials');
    expect(eq).toHaveBeenCalledWith('approved', true);
    expect(rows).toHaveLength(1);
  });
});
