import { supabase } from '@/integrations/supabase/client';
import { pauseInstanceQueryPrefix } from '@/features/pause/application/queries/pause-instance-query-prefix';
import { parseCompanionSlotFavoritesFromMetadata } from '@/features/pause/domain/companion/companion-slot-favorites-metadata';

export { COMPANION_SLOT_FAVORITES_METADATA_KEY } from '@/features/pause/domain/companion/companion-slot-favorites-metadata';

export const COMPANION_LIBRARY_FAVORITES_QUERY_LEAF = 'companion-library-favorites' as const;

export const COMPANION_LIBRARY_FAVORITES_NONE_QUERY_KEY = [
  ...pauseInstanceQueryPrefix('none'),
  COMPANION_LIBRARY_FAVORITES_QUERY_LEAF,
] as const;

export function companionLibraryFavoritesQueryKey(pauseInstanceId: string) {
  return [...pauseInstanceQueryPrefix(pauseInstanceId), COMPANION_LIBRARY_FAVORITES_QUERY_LEAF] as const;
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
  return parseCompanionSlotFavoritesFromMetadata(data.metadata);
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
