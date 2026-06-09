export const COMPANION_SLOT_FAVORITES_METADATA_KEY = 'companion_slot_favorites';

export function parseCompanionSlotFavoritesFromMetadata(
  metadata: unknown,
): Record<string, boolean> {
  const meta = (metadata as Record<string, unknown>) ?? {};
  const fav = meta[COMPANION_SLOT_FAVORITES_METADATA_KEY];
  if (fav && typeof fav === 'object' && !Array.isArray(fav)) {
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(fav as Record<string, unknown>)) {
      if (typeof v === 'boolean') out[k] = v;
    }
    return out;
  }
  return {};
}

/** Flip one slot in an in-memory favorites bucket (multiple slots may be favorited). */
export function flipCompanionSlotFavoriteInBucket(
  bucket: Record<string, boolean>,
  sourceType: string,
): Record<string, boolean> {
  return { ...bucket, [sourceType]: !bucket[sourceType] };
}

/** Merge client bucket over DB favorites (union of keys; client wins on conflicts). */
export function mergeCompanionSlotFavoriteBuckets(
  fromDb: Record<string, boolean>,
  clientBucket: Record<string, boolean>,
): Record<string, boolean> {
  return { ...fromDb, ...clientBucket };
}

/** Flip one slot favorite; returns the bucket to persist on `pause_instances.metadata`. */
export function computeCompanionSlotFavoriteToggle(
  metadata: unknown,
  sourceType: string,
): Record<string, boolean> {
  return flipCompanionSlotFavoriteInBucket(parseCompanionSlotFavoritesFromMetadata(metadata), sourceType);
}
