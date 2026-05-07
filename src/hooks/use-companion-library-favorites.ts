import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import {
  COMPANION_SLOT_FAVORITES_METADATA_KEY,
  companionLibraryFavoritesQueryKey,
  getCompanionLibraryFavoritesQueryOptions,
} from '@/lib/companion-library-favorites-query';

/**
 * Per-slot heart state for companion cards on one pause instance.
 * Stored on `pause_instances.metadata` (not `library_items`).
 */
export function useCompanionLibraryFavorites(pauseInstanceId: string | null | undefined) {
  const queryClient = useQueryClient();

  const { data: favorites = {} } = useQuery(getCompanionLibraryFavoritesQueryOptions(pauseInstanceId));

  const toggleCompanionFavorite = useCallback(
    async (sourceType: string) => {
      if (!pauseInstanceId) return;
      const key = companionLibraryFavoritesQueryKey(pauseInstanceId);
      const { data: row, error: fetchErr } = await supabase
        .from('pause_instances')
        .select('metadata')
        .eq('id', pauseInstanceId)
        .single();
      if (fetchErr || !row) return;
      const meta = { ...((row.metadata as Record<string, unknown>) ?? {}) };
      const prevBucket = {
        ...((meta[COMPANION_SLOT_FAVORITES_METADATA_KEY] as Record<string, boolean> | undefined) ?? {}),
      };
      const newVal = !prevBucket[sourceType];
      const bucket = { ...prevBucket, [sourceType]: newVal };
      meta[COMPANION_SLOT_FAVORITES_METADATA_KEY] = bucket;
      queryClient.setQueryData<Record<string, boolean>>(key, bucket);
      await supabase
        .from('pause_instances')
        .update({ metadata: meta as unknown as Json })
        .eq('id', pauseInstanceId);
    },
    [pauseInstanceId, queryClient],
  );

  return { favorites, toggleCompanionFavorite };
}
