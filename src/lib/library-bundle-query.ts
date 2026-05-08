/**
 * Library collections bundle: TanStack query keys + parallel Supabase reads
 * for collections, collection_items, and member pause rows from `v_pause_full`.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

/** Archive list views and collection members both expose `v_pause_full`-shaped rows. */
export type CollectionMemberPause = Database['public']['Views']['v_pause_full']['Row'];

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  pause_instance_id: string;
  position: number;
  added_at: string;
}

export type LibraryListSortMode = 'newest' | 'oldest' | 'alphabetical';

export type LibraryBundle = {
  collections: Collection[];
  collectionItems: CollectionItem[];
  items: CollectionMemberPause[];
  /** True when `v_pause_full` member fetch failed but collections + items loaded. */
  memberRowsLoadFailed: boolean;
};

const PAUSE_IN_CHUNK = 80;

export const LIBRARY_BUNDLE_QUERY_PREFIX = ['library', 'bundle'] as const;

/** Prefix for TanStack invalidation (e.g. pause completion → refresh member rows). */
export function libraryBundleQueryPrefix(userId: string) {
  return [...LIBRARY_BUNDLE_QUERY_PREFIX, userId] as const;
}

/** User-id segment for {@link getLibraryBundleDisabledQueryOptions} when signed out. */
export const LIBRARY_BUNDLE_DISABLED_USER_ID = '__none__' as const;

export function buildMemberCacheKey(listSort: LibraryListSortMode): string {
  return `holzen_collection_member_pauses:${listSort}`;
}

export function sortMemberPauses(
  rows: CollectionMemberPause[],
  listSort: LibraryListSortMode,
): CollectionMemberPause[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const ta = new Date(a.terminal_at ?? a.created_at ?? 0).getTime();
    const tb = new Date(b.terminal_at ?? b.created_at ?? 0).getTime();
    if (listSort === 'oldest') return ta - tb;
    if (listSort === 'alphabetical')
      return (a.source ?? '').localeCompare(b.source ?? '', undefined, { sensitivity: 'base' });
    return tb - ta;
  });
  return copy;
}

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
