import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import {
  COMPANION_SLOT_FAVORITES_METADATA_KEY,
  mergeCompanionSlotFavoriteBuckets,
  parseCompanionSlotFavoritesFromMetadata,
} from '@/features/pause/domain/companion/companion-slot-favorites-metadata';

/** Persist companion slot favorites on `pause_instances.metadata` (RLS on instance row). */
export async function toggleCompanionSlotFavoriteOnInstance(params: {
  pauseInstanceId: string;
  /** Client-computed bucket after toggle (merged over DB on write). */
  nextBucket: Record<string, boolean>;
  /** Called with the merged bucket before the persist write. */
  onBucketComputed?: (bucket: Record<string, boolean>) => void;
}): Promise<boolean> {
  const { pauseInstanceId, nextBucket, onBucketComputed } = params;
  const { data: row, error: fetchErr } = await supabase
    .from('pause_instances')
    .select('metadata')
    .eq('id', pauseInstanceId)
    .single();
  if (fetchErr || !row) return false;

  const meta = { ...((row.metadata as Record<string, unknown>) ?? {}) };
  const bucket = mergeCompanionSlotFavoriteBuckets(
    parseCompanionSlotFavoritesFromMetadata(meta),
    nextBucket,
  );
  meta[COMPANION_SLOT_FAVORITES_METADATA_KEY] = bucket;
  onBucketComputed?.(bucket);

  const { error: updateErr } = await supabase
    .from('pause_instances')
    .update({ metadata: meta as unknown as Json })
    .eq('id', pauseInstanceId);
  return !updateErr;
}
