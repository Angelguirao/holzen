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

/** Flip one slot favorite; returns the bucket to persist on `pause_instances.metadata`. */
export function computeCompanionSlotFavoriteToggle(
  metadata: unknown,
  sourceType: string,
): Record<string, boolean> {
  const meta = { ...((metadata as Record<string, unknown>) ?? {}) };
  const prevBucket = {
    ...parseCompanionSlotFavoritesFromMetadata(meta),
  };
  return { ...prevBucket, [sourceType]: !prevBucket[sourceType] };
}
