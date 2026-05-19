import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ChangelogEntryRow = Pick<
  Database['public']['Tables']['changelog_entries']['Row'],
  'id' | 'version' | 'date' | 'changes' | 'created_at'
>;

export const CHANGELOG_LATEST_VERSION_QUERY_PREFIX = ['changelog-entries'] as const;

export const CHANGELOG_LATEST_VERSION_QUERY_LEAF = 'latest-version' as const;

export const CHANGELOG_LATEST_VERSION_QUERY_KEY = [
  ...CHANGELOG_LATEST_VERSION_QUERY_PREFIX,
  CHANGELOG_LATEST_VERSION_QUERY_LEAF,
] as const;

export async function fetchLatestChangelogVersion(): Promise<string | null> {
  const { data, error } = await supabase
    .from('changelog_entries')
    .select('version')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.version) return null;
  return data.version as string;
}

export function getLatestChangelogVersionQueryOptions() {
  return {
    queryKey: CHANGELOG_LATEST_VERSION_QUERY_KEY,
    queryFn: fetchLatestChangelogVersion,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}

export const CHANGELOG_ENTRIES_PAGE_SIZE = 15;

export const CHANGELOG_ENTRIES_QUERY_PREFIX = ['changelog'] as const;

export const CHANGELOG_ENTRIES_QUERY_LEAF = 'entries' as const;

export const CHANGELOG_ENTRIES_QUERY_KEY = [
  ...CHANGELOG_ENTRIES_QUERY_PREFIX,
  CHANGELOG_ENTRIES_QUERY_LEAF,
] as const;

export async function fetchChangelogEntriesPage(
  cursor: string | undefined,
  pageSize: number = CHANGELOG_ENTRIES_PAGE_SIZE,
): Promise<ChangelogEntryRow[]> {
  let q = supabase
    .from('changelog_entries')
    .select('id, version, date, changes, created_at')
    .order('created_at', { ascending: false })
    .limit(pageSize);
  if (cursor) q = q.lt('created_at', cursor);
  const { data, error } = await q;
  if (error) return [];
  return (data as ChangelogEntryRow[]) ?? [];
}

function changelogEntriesInfiniteQueryCore(pageSize: number = CHANGELOG_ENTRIES_PAGE_SIZE) {
  return {
    queryKey: CHANGELOG_ENTRIES_QUERY_KEY,
    queryFn: ({ pageParam }: { pageParam: unknown }) =>
      fetchChangelogEntriesPage(pageParam as string | undefined, pageSize),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: ChangelogEntryRow[]) =>
      lastPage.length < pageSize ? undefined : lastPage[lastPage.length - 1]!.created_at,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  };
}

export function getChangelogEntriesInfiniteQueryOptions(open: boolean) {
  return {
    ...changelogEntriesInfiniteQueryCore(),
    enabled: open,
  };
}

/** Warm the first changelog page before the dialog opens (hover / keyboard focus on trigger). */
export function prefetchChangelogEntriesFirstPage(queryClient: QueryClient): Promise<void> {
  return queryClient.prefetchInfiniteQuery(changelogEntriesInfiniteQueryCore());
}
