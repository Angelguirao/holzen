import { supabase } from '@/integrations/supabase/client';

export const HOLZEN_PINNED_REFLECTION_STORAGE_KEY = 'holzen_pinned_reflection';

export const HOME_PINNED_PAUSE_PREVIEW_QUERY_PREFIX = ['home', 'pinned-pause-preview'] as const;

export const HOME_PINNED_PAUSE_PREVIEW_DISABLED_SEGMENT = 'disabled' as const;

export const PINNED_PREVIEW_QUERY_DISABLED_KEY = [
  ...HOME_PINNED_PAUSE_PREVIEW_QUERY_PREFIX,
  HOME_PINNED_PAUSE_PREVIEW_DISABLED_SEGMENT,
] as const;

export interface PinnedPausePreview {
  id: string;
  context: string | null;
}

export function homePinnedPausePreviewQueryKey(userId: string, pinnedId: string) {
  return [...HOME_PINNED_PAUSE_PREVIEW_QUERY_PREFIX, userId, pinnedId] as const;
}

/** User-scoped prefix for `invalidateQueries` / `removeQueries` over every pinned-id variant. */
export function homePinnedPausePreviewQueryPrefix(userId: string) {
  return [...HOME_PINNED_PAUSE_PREVIEW_QUERY_PREFIX, userId] as const;
}

export function readHomePinnedReflectionId(): string | null {
  try {
    return localStorage.getItem(HOLZEN_PINNED_REFLECTION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearHomePinnedReflectionId(): void {
  try {
    localStorage.removeItem(HOLZEN_PINNED_REFLECTION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export async function fetchPinnedPausePreview(userId: string, pinnedId: string): Promise<PinnedPausePreview | null> {
  const { data: inst } = await supabase
    .from('pause_instances' as never)
    .select('id, context_snapshot')
    .eq('id', pinnedId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!inst) {
    clearHomePinnedReflectionId();
    return null;
  }
  const ctxSnap = ((inst as { context_snapshot: Record<string, unknown> | null }).context_snapshot ??
    {}) as Record<string, unknown>;
  const context = typeof ctxSnap.context_text === 'string' ? (ctxSnap.context_text as string) : null;
  return { id: pinnedId, context };
}

export function getHomePinnedPausePreviewQueryOptions(userId: string | null, pinnedLocalId: string | null) {
  return {
    queryKey:
      userId && pinnedLocalId
        ? homePinnedPausePreviewQueryKey(userId, pinnedLocalId)
        : PINNED_PREVIEW_QUERY_DISABLED_KEY,
    queryFn: () => fetchPinnedPausePreview(userId!, pinnedLocalId!),
    enabled: Boolean(userId && pinnedLocalId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
