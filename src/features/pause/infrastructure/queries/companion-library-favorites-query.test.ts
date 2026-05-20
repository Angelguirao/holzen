import { describe, expect, it, vi, beforeEach } from 'vitest';

const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
const single = vi.fn(async () => ({
  data: { metadata: { companion_slot_favorites: { signal: true } } },
  error: null,
}));
const select = vi.fn(() => ({ eq: vi.fn(() => ({ single })) }));
const from = vi.fn(() => ({ select, update }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from },
}));

describe('companion-library-favorites-query', () => {
  beforeEach(() => {
    from.mockClear();
    update.mockClear();
  });

  it('toggleCompanionLibraryFavorite updates metadata and calls onBucketComputed', async () => {
    const { toggleCompanionLibraryFavorite, COMPANION_SLOT_FAVORITES_METADATA_KEY } = await import(
      './companion-library-favorites-query'
    );
    const buckets: Record<string, boolean>[] = [];
    const ok = await toggleCompanionLibraryFavorite('pause-1', 'signal', {
      onBucketComputed: (bucket) => buckets.push(bucket),
    });
    expect(ok).toBe(true);
    expect(buckets[0]).toEqual({ signal: false });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          [COMPANION_SLOT_FAVORITES_METADATA_KEY]: { signal: false },
        }),
      }),
    );
  });
});
