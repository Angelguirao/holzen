import { describe, expect, it, vi, beforeEach } from 'vitest';
import { COMPANION_SLOT_FAVORITES_METADATA_KEY } from '@/features/pause/domain/companion/companion-slot-favorites-metadata';

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

describe('pause-instance-metadata-client', () => {
  beforeEach(() => {
    from.mockClear();
    update.mockClear();
  });

  it('toggleCompanionSlotFavoriteOnInstance updates metadata and calls onBucketComputed', async () => {
    const { toggleCompanionSlotFavoriteOnInstance } = await import('./pause-instance-metadata-client');
    const buckets: Record<string, boolean>[] = [];
    const ok = await toggleCompanionSlotFavoriteOnInstance({
      pauseInstanceId: 'pause-1',
      sourceType: 'signal',
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
