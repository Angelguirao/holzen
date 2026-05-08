/**
 * Pause / echo archive infinite list: Supabase reads against
 * `v_pause_archive_pauses` / `v_pause_archive_echoes` plus stable TanStack keys.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type PauseArchiveSegment = 'pauses' | 'echoes';

export type PauseArchiveListSort = 'newest' | 'oldest' | 'alphabetical';

/** Archive list views and collection members both expose `v_pause_full`-shaped rows. */
export type PauseArchiveRow = Database['public']['Views']['v_pause_full']['Row'];

export const PAUSE_ARCHIVE_PAGE_SIZE = 50;

const TABLE: Record<PauseArchiveSegment, 'v_pause_archive_pauses' | 'v_pause_archive_echoes'> = {
  pauses: 'v_pause_archive_pauses',
  echoes: 'v_pause_archive_echoes',
};

/** Prefix for TanStack invalidation when pause lifecycle bumps archive-related caches. */
export function pauseArchiveListQueryPrefix(userId: string) {
  return ['pause-archive', userId] as const;
}

export function pauseArchiveInfiniteQueryKey(
  userId: string,
  segment: PauseArchiveSegment,
  favoritesOnly: boolean,
  listSort: PauseArchiveListSort,
) {
  return [...pauseArchiveListQueryPrefix(userId), segment, favoritesOnly ? 'fav' : 'all', listSort] as const;
}

export function pauseArchiveStorageCacheKey(
  segment: PauseArchiveSegment,
  favoritesOnly: boolean,
  sort: PauseArchiveListSort,
) {
  return `holzen_pause_archive:${segment}:${favoritesOnly ? 'fav' : 'all'}:${sort}`;
}

export async function fetchPauseArchivePage(
  userId: string,
  segment: PauseArchiveSegment,
  favoritesOnly: boolean,
  listSort: PauseArchiveListSort,
  offset: number,
): Promise<PauseArchiveRow[]> {
  const table = TABLE[segment];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = (supabase as any).from(table).select('*').eq('user_id', userId);
  if (favoritesOnly) q = q.eq('is_favorite', true);
  if (listSort === 'alphabetical') {
    q = q.order('source', { ascending: true, nullsFirst: false }).order('terminal_at', { ascending: false, nullsFirst: false });
  } else if (listSort === 'oldest') {
    q = q.order('terminal_at', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
  } else {
    q = q.order('terminal_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  }
  const { data, error } = await q.range(offset, offset + PAUSE_ARCHIVE_PAGE_SIZE - 1);
  if (error) throw error;
  return (data as PauseArchiveRow[]) ?? [];
}

/** Shared infinite-query tuning (hook supplies dynamic `queryKey` + `queryFn` closure). */
export function getPauseArchiveInfiniteQueryDefaults() {
  return {
    initialPageParam: 0,
    getNextPageParam: (lastPage: PauseArchiveRow[], allPages: PauseArchiveRow[][]) => {
      if (lastPage.length < PAUSE_ARCHIVE_PAGE_SIZE) return undefined;
      return allPages.reduce((sum, p) => sum + p.length, 0);
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  };
}
