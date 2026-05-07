import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import {
  clearHomePinnedReflectionId,
  getHomePinnedPausePreviewQueryOptions,
  homePinnedPausePreviewQueryPrefix,
  readHomePinnedReflectionId,
  type PinnedPausePreview,
} from '@/lib/home-pinned-pause-preview-query';

export type { PinnedPausePreview } from '@/lib/home-pinned-pause-preview-query';
export {
  homePinnedPausePreviewQueryKey,
  homePinnedPausePreviewQueryPrefix,
} from '@/lib/home-pinned-pause-preview-query';

/**
 * Loads a user-pinned pause reflection preview from localStorage + `pause_instances`.
 */
export function useHomePinnedPausePreview(user: User | null): {
  pinnedPausePreview: PinnedPausePreview | null;
  unpinPausePreview: () => void;
} {
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const [pinnedLocalId, setPinnedLocalId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPinnedLocalId(null);
      return;
    }
    setPinnedLocalId(readHomePinnedReflectionId());
  }, [userId]);

  const { data: pinnedPausePreview = null, isSuccess } = useQuery(
    getHomePinnedPausePreviewQueryOptions(userId, pinnedLocalId),
  );

  /** If the row was missing we clear storage in `queryFn`; drop the local pin id so `enabled` goes false. */
  useEffect(() => {
    if (!isSuccess || pinnedPausePreview !== null || !pinnedLocalId) return;
    setPinnedLocalId(readHomePinnedReflectionId());
  }, [isSuccess, pinnedPausePreview, pinnedLocalId]);

  const unpinPausePreview = useCallback(() => {
    clearHomePinnedReflectionId();
    setPinnedLocalId(null);
    if (userId) {
      void queryClient.removeQueries({ queryKey: homePinnedPausePreviewQueryPrefix(userId) });
    }
  }, [queryClient, userId]);

  return { pinnedPausePreview, unpinPausePreview };
}
