import { describe, expect, it, vi, beforeEach } from 'vitest';

const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
const deleteEq = vi.fn(async () => ({ error: null }));
const insert = vi.fn(async () => ({ error: null }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      update,
      delete: () => ({ eq: deleteEq }),
      insert,
    }),
  },
}));

describe('companion-fallbacks-admin-mutations', () => {
  beforeEach(() => {
    update.mockClear();
    insert.mockClear();
    deleteEq.mockClear();
  });

  it('setCompanionFallbackActive toggles is_active', async () => {
    const { setCompanionFallbackActive } = await import('./companion-fallbacks-admin-mutations');
    const result = await setCompanionFallbackActive('fb-1', false);
    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false, updated_at: expect.any(String) }),
    );
  });

  it('deleteCompanionFallback removes row', async () => {
    const { deleteCompanionFallback } = await import('./companion-fallbacks-admin-mutations');
    const result = await deleteCompanionFallback('fb-2');
    expect(result.ok).toBe(true);
    expect(deleteEq).toHaveBeenCalledWith('id', 'fb-2');
  });
});
