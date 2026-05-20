import { describe, expect, it, vi, beforeEach } from 'vitest';

const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ update }),
  },
}));

describe('companion-cache-admin-mutations', () => {
  beforeEach(() => {
    update.mockClear();
  });

  it('promoteCompanionCacheEntry sets quality 3 and null expiry', async () => {
    const { promoteCompanionCacheEntry } = await import('./companion-cache-admin-mutations');
    const result = await promoteCompanionCacheEntry('cache-1');
    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith({ quality_score: 3, expires_at: null });
  });

  it('setCompanionCacheSourceUntrusted updates flag', async () => {
    const { setCompanionCacheSourceUntrusted } = await import('./companion-cache-admin-mutations');
    await setCompanionCacheSourceUntrusted('cache-2', true);
    expect(update).toHaveBeenCalledWith({ source_untrusted: true });
  });
});
