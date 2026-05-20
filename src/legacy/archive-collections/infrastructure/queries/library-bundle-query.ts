import type { UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sortMemberPauses } from '@/legacy/archive-collections/application/use-cases/library/sort-member-pauses';
import {
  LIBRARY_BUNDLE_DISABLED_USER_ID,
  libraryBundleQueryPrefix,
} from '@/legacy/archive-collections/application/queries/library-bundle-keys';
import type {
  Collection,
  CollectionItem,
  CollectionMemberPause,
  LibraryBundle,
  LibraryListSortMode,
} from '@/legacy/archive-collections/domain/library-bundle';

export {
  LIBRARY_BUNDLE_DISABLED_USER_ID,
  LIBRARY_BUNDLE_QUERY_PREFIX,
  libraryBundleQueryPrefix,
} from '@/legacy/archive-collections/application/queries/library-bundle-keys';
export { buildMemberCacheKey, sortMemberPauses } from '@/legacy/archive-collections/application/use-cases/library/sort-member-pauses';
export type {
  Collection,
  CollectionItem,
  CollectionMemberPause,
  LibraryBundle,
  LibraryListSortMode,
} from '@/legacy/archive-collections/domain/library-bundle';

const PAUSE_IN_CHUNK = 80;

async function fetchLibraryMemberPausesForIds(
  userId: string,
  ids: string[],
): Promise<{ data: CollectionMemberPause[] | null; error: unknown }> {
  if (ids.length === 0) return { data: [], error: null };
  const merged: CollectionMemberPause[] = [];
  for (let i = 0; i < ids.length; i += PAUSE_IN_CHUNK) {
    const chunk = ids.slice(i, i + PAUSE_IN_CHUNK);
    const { data, error } = await supabase
      .from('v_pause_full' as never)
      .select('*')
      .eq('user_id', userId)
      .in('id', chunk);
    if (error) return { data: null, error };
    merged.push(...((data ?? []) as unknown as CollectionMemberPause[]));
  }
  return { data: merged, error: null };
}

export async function fetchLibraryBundle(
  userId: string,
  listSort: LibraryListSortMode,
  memberCacheKey: string,
  t: (key: string) => string,
): Promise<LibraryBundle> {
  const [rCols, rColItems] = await Promise.all([
    supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('collection_items').select('*').order('position', { ascending: true }),
  ]);

  if (rCols.error || rColItems.error) {
    toast.error(t('library.collectionsPartialLoadFailed'));
    throw rCols.error ?? rColItems.error;
  }

  const cols = (rCols.data as unknown as Collection[]) ?? [];
  const cis = (rColItems.data as unknown as CollectionItem[]) ?? [];
  const colIds = new Set(cols.map((c) => c.id));
  const pauseIds = [...new Set(cis.filter((ci) => colIds.has(ci.collection_id)).map((ci) => ci.pause_instance_id))];

  const { data: raw, error: pErr } = await fetchLibraryMemberPausesForIds(userId, pauseIds);
  if (pErr != null || raw == null) {
    try {
      const rawCached = localStorage.getItem(memberCacheKey);
      const cachedItems = rawCached ? (JSON.parse(rawCached) as CollectionMemberPause[]) : [];
      return {
        collections: cols,
        collectionItems: cis,
        items: sortMemberPauses(cachedItems, listSort),
        memberRowsLoadFailed: true,
      };
    } catch {
      return {
        collections: cols,
        collectionItems: cis,
        items: [],
        memberRowsLoadFailed: true,
      };
    }
  }

  return {
    collections: cols,
    collectionItems: cis,
    items: sortMemberPauses(raw, listSort),
    memberRowsLoadFailed: false,
  };
}

const LIBRARY_BUNDLE_STALE_MS = 60_000;

export function getLibraryBundleQueryOptions(params: {
  userId: string;
  listSort: LibraryListSortMode;
  memberCacheKey: string;
  t: (key: string) => string;
}): Pick<
  UseQueryOptions<LibraryBundle>,
  'queryKey' | 'queryFn' | 'staleTime' | 'retry' | 'refetchOnWindowFocus'
> {
  const { userId, listSort, memberCacheKey, t } = params;
  return {
    queryKey: [...libraryBundleQueryPrefix(userId), listSort],
    queryFn: () => fetchLibraryBundle(userId, listSort, memberCacheKey, t),
    staleTime: LIBRARY_BUNDLE_STALE_MS,
    retry: false,
    refetchOnWindowFocus: true,
  };
}

/** Placeholder query when logged out — stays disabled via `enabled: false` on the hook. */
export function getLibraryBundleDisabledQueryOptions(listSort: LibraryListSortMode): Pick<
  UseQueryOptions<LibraryBundle>,
  'queryKey' | 'queryFn' | 'staleTime' | 'retry' | 'refetchOnWindowFocus'
> {
  const empty: LibraryBundle = {
    collections: [],
    collectionItems: [],
    items: [],
    memberRowsLoadFailed: false,
  };
  return {
    queryKey: [...libraryBundleQueryPrefix(LIBRARY_BUNDLE_DISABLED_USER_ID), listSort],
    queryFn: async () => empty,
    staleTime: LIBRARY_BUNDLE_STALE_MS,
    retry: false,
    refetchOnWindowFocus: true,
  };
}
