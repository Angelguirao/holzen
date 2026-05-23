import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type RoadmapListItem = Pick<
  Database['public']['Tables']['roadmap_items']['Row'],
  'id' | 'title' | 'description' | 'status' | 'vote_count' | 'category'
>;

export const ROADMAP_ITEMS_PAGE_SIZE = 30;

export const ROADMAP_QUERY_PREFIX = ['roadmap'] as const;

export const ROADMAP_ITEMS_QUERY_LEAF = 'items' as const;

export const ROADMAP_ITEMS_QUERY_KEY = [...ROADMAP_QUERY_PREFIX, ROADMAP_ITEMS_QUERY_LEAF] as const;

export const ROADMAP_VOTES_QUERY_LEAF = 'votes' as const;

export const ROADMAP_VOTES_QUERY_PREFIX = [
  ...ROADMAP_QUERY_PREFIX,
  ROADMAP_VOTES_QUERY_LEAF,
] as const;

export const ROADMAP_VOTES_DISABLED_USER_ID = 'none' as const;

export function roadmapVotesQueryKey(userId: string) {
  return [...ROADMAP_VOTES_QUERY_PREFIX, userId] as const;
}

export const ROADMAP_VOTES_NONE_QUERY_KEY = [
  ...ROADMAP_VOTES_QUERY_PREFIX,
  ROADMAP_VOTES_DISABLED_USER_ID,
] as const;

/** Signed-in user's voted `roadmap_items` ids (empty when logged out). */
export function getRoadmapVotesQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? roadmapVotesQueryKey(userId) : ROADMAP_VOTES_NONE_QUERY_KEY,
    queryFn: () => fetchRoadmapVotes(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}

export async function fetchRoadmapItemsPage(
  offset: number,
  pageSize: number = ROADMAP_ITEMS_PAGE_SIZE,
): Promise<RoadmapListItem[]> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('id, title, description, status, vote_count, category')
    .order('vote_count', { ascending: false })
    .range(offset, offset + pageSize - 1);
  if (error) throw error;
  return (data as RoadmapListItem[]) ?? [];
}

export async function fetchRoadmapVotes(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('roadmap_votes').select('item_id').eq('user_id', userId);
  if (error) throw error;
  return data?.map((v) => v.item_id) ?? [];
}

export async function deleteRoadmapVote(userId: string, itemId: string): Promise<void> {
  const { error } = await supabase.from('roadmap_votes').delete().eq('user_id', userId).eq('item_id', itemId);
  if (error) throw error;
}

export async function insertRoadmapVote(userId: string, itemId: string): Promise<void> {
  const { error } = await supabase.from('roadmap_votes').insert({ user_id: userId, item_id: itemId });
  if (error) throw error;
}

export function getRoadmapItemsInfiniteQueryOptions() {
  const pageSize = ROADMAP_ITEMS_PAGE_SIZE;
  return {
    queryKey: ROADMAP_ITEMS_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchRoadmapItemsPage(pageParam as number, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage: RoadmapListItem[], allPages: RoadmapListItem[][]) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.reduce((sum, p) => sum + p.length, 0);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  };
}
