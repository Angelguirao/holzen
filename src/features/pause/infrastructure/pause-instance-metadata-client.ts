import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import {
  COMPANION_SLOT_FAVORITES_METADATA_KEY,
  computeCompanionSlotFavoriteToggle,
} from '@/features/pause/domain/companion/companion-slot-favorites-metadata';

/** Toggle one companion slot favorite on `pause_instances.metadata` (RLS on instance row). */
export async function toggleCompanionSlotFavoriteOnInstance(params: {
  pauseInstanceId: string;
  sourceType: string;
  /** Called with the new bucket before the persist write (optimistic UI). */
  onBucketComputed?: (bucket: Record<string, boolean>) => void;
}): Promise<boolean> {
  const { pauseInstanceId, sourceType, onBucketComputed } = params;
  const { data: row, error: fetchErr } = await supabase
    .from('pause_instances')
    .select('metadata')
    .eq('id', pauseInstanceId)
    .single();
  if (fetchErr || !row) return false;

  const meta = { ...((row.metadata as Record<string, unknown>) ?? {}) };
  const bucket = computeCompanionSlotFavoriteToggle(meta, sourceType);
  meta[COMPANION_SLOT_FAVORITES_METADATA_KEY] = bucket;
  onBucketComputed?.(bucket);

  await supabase
    .from('pause_instances')
    .update({ metadata: meta as unknown as Json })
    .eq('id', pauseInstanceId);
  return true;
}
