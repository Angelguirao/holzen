import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const PINNED_KEY = 'holzen_pinned_reflection';

const PINNED_PREVIEW_QUERY_DISABLED_KEY = ['home', 'pinned-pause-preview', 'disabled'] as const;

export interface PinnedPausePreview {
  id: string;
  context: string | null;
}

export function homePinnedPausePreviewQueryKey(userId: string, pinnedId: string) {
  return ['home', 'pinned-pause-preview', userId, pinnedId] as const;
}

function readPinnedId(): string | null {
  try {
    return localStorage.getItem(PINNED_KEY);
  } catch {
    return null;
  }
}

async function fetchPinnedPausePreview(userId: string, pinnedId: string): Promise<PinnedPausePreview | null> {
  const { data: inst } = await supabase
    .from('pause_instances' as never)
    .select('id, context_snapshot')
    .eq('id', pinnedId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!inst) {
    try {
      localStorage.removeItem(PINNED_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
  const ctxSnap = ((inst as { context_snapshot: Record<string, unknown> | null }).context_snapshot ??
    {}) as Record<string, unknown>;
  const context = typeof ctxSnap.context_text === 'string' ? (ctxSnap.context_text as string) : null;
  return { id: pinnedId, context };
}

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
    setPinnedLocalId(readPinnedId());
  }, [userId]);

  const { data: pinnedPausePreview = null, isSuccess } = useQuery({
    queryKey:
      userId && pinnedLocalId
        ? homePinnedPausePreviewQueryKey(userId, pinnedLocalId)
        : PINNED_PREVIEW_QUERY_DISABLED_KEY,
    queryFn: () => fetchPinnedPausePreview(userId!, pinnedLocalId!),
    enabled: Boolean(userId && pinnedLocalId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  /** If the row was missing we clear storage in `queryFn`; drop the local pin id so `enabled` goes false. */
  useEffect(() => {
    if (!isSuccess || pinnedPausePreview !== null || !pinnedLocalId) return;
    setPinnedLocalId(readPinnedId());
  }, [isSuccess, pinnedPausePreview, pinnedLocalId]);

  const unpinPausePreview = useCallback(() => {
    try {
      localStorage.removeItem(PINNED_KEY);
    } catch {
      /* ignore */
    }
    setPinnedLocalId(null);
    if (userId) {
      void queryClient.removeQueries({ queryKey: ['home', 'pinned-pause-preview', userId] });
    }
  }, [queryClient, userId]);

  return { pinnedPausePreview, unpinPausePreview };
}
