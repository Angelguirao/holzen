import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { runToggleCompanionLibraryFavorite } from '@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite';
import { supabasePauseRepository } from '@/features/pause/public-rpc';
import {
  companionLibraryFavoritesQueryKey,
  getCompanionLibraryFavoritesQueryOptions,
} from '@/features/pause/public-queries';

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
      await runToggleCompanionLibraryFavorite(supabasePauseRepository, {
        pauseInstanceId,
        sourceType,
        onBucketComputed: (bucket) => {
          queryClient.setQueryData<Record<string, boolean>>(key, bucket);
        },
      });
    },
    [pauseInstanceId, queryClient],
  );

  return { favorites, toggleCompanionFavorite };
}
