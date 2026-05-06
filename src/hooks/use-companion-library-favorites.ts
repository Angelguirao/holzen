import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

const FAVORITES_KEY = 'companion_slot_favorites';

export const COMPANION_LIBRARY_FAVORITES_QUERY_KEY = (pauseInstanceId: string) =>
  ['pause-instance', pauseInstanceId, 'companion-library-favorites'] as const;

function parseFavoritesFromMetadata(metadata: unknown): Record<string, boolean> {
  const meta = (metadata as Record<string, unknown>) ?? {};
  const fav = meta[FAVORITES_KEY];
  if (fav && typeof fav === 'object' && !Array.isArray(fav)) {
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(fav as Record<string, unknown>)) {
      if (typeof v === 'boolean') out[k] = v;
    }
    return out;
  }
  return {};
}

async function fetchCompanionLibraryFavorites(pauseInstanceId: string): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('pause_instances')
    .select('metadata')
    .eq('id', pauseInstanceId)
    .single();
  if (error || !data) return {};
  return parseFavoritesFromMetadata(data.metadata);
}

/**
 * Per-slot heart state for companion cards on one pause instance.
 * Stored on `pause_instances.metadata` (not `library_items`).
 */
export function useCompanionLibraryFavorites(pauseInstanceId: string | null | undefined) {
  const queryClient = useQueryClient();

  const { data: favorites = {} } = useQuery({
    queryKey: pauseInstanceId ? COMPANION_LIBRARY_FAVORITES_QUERY_KEY(pauseInstanceId) : ['pause-instance', 'none', 'companion-library-favorites'],
    queryFn: () => fetchCompanionLibraryFavorites(pauseInstanceId!),
    enabled: Boolean(pauseInstanceId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const toggleCompanionFavorite = useCallback(
    async (sourceType: string) => {
      if (!pauseInstanceId) return;
      const key = COMPANION_LIBRARY_FAVORITES_QUERY_KEY(pauseInstanceId);
      const { data: row, error: fetchErr } = await supabase
        .from('pause_instances')
        .select('metadata')
        .eq('id', pauseInstanceId)
        .single();
      if (fetchErr || !row) return;
      const meta = { ...((row.metadata as Record<string, unknown>) ?? {}) };
      const prevBucket = { ...((meta[FAVORITES_KEY] as Record<string, boolean> | undefined) ?? {}) };
      const newVal = !prevBucket[sourceType];
      const bucket = { ...prevBucket, [sourceType]: newVal };
      meta[FAVORITES_KEY] = bucket;
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
