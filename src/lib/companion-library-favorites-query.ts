import { supabase } from '@/integrations/supabase/client';
import { pauseInstanceQueryPrefix } from '@/features/pause/application/queries/pause-instance-query-prefix';

/** JSON key on `pause_instances.metadata` for per-slot hearts (shared with toggle writes). */
export const COMPANION_SLOT_FAVORITES_METADATA_KEY = 'companion_slot_favorites';

export const COMPANION_LIBRARY_FAVORITES_QUERY_LEAF = 'companion-library-favorites' as const;

export const COMPANION_LIBRARY_FAVORITES_NONE_QUERY_KEY = [
  ...pauseInstanceQueryPrefix('none'),
  COMPANION_LIBRARY_FAVORITES_QUERY_LEAF,
] as const;

export function companionLibraryFavoritesQueryKey(pauseInstanceId: string) {
  return [...pauseInstanceQueryPrefix(pauseInstanceId), COMPANION_LIBRARY_FAVORITES_QUERY_LEAF] as const;
}

function parseFavoritesFromMetadata(metadata: unknown): Record<string, boolean> {
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

export async function fetchCompanionLibraryFavorites(
  pauseInstanceId: string,
): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('pause_instances')
    .select('metadata')
    .eq('id', pauseInstanceId)
    .single();
  if (error || !data) return {};
  return parseFavoritesFromMetadata(data.metadata);
}

export function getCompanionLibraryFavoritesQueryOptions(pauseInstanceId: string | null | undefined) {
  return {
    queryKey: pauseInstanceId
      ? companionLibraryFavoritesQueryKey(pauseInstanceId)
      : COMPANION_LIBRARY_FAVORITES_NONE_QUERY_KEY,
    queryFn: () => fetchCompanionLibraryFavorites(pauseInstanceId!),
    enabled: Boolean(pauseInstanceId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  } as const;
}
