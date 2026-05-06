import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo } from 'react';
import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PageMeta } from '@/components/PageMeta';
import { PublicFooter } from '@/components/PublicFooter';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { PageHeading } from '@/components/PageHeading';

const PAGE_SIZE = 30;
const CATEGORIES = ['all', 'self', 'together', 'intelligence', 'reach'] as const;

const categoryTone: Record<string, 'default' | 'secondary' | 'outline'> = {
  self: 'default',
  together: 'secondary',
  intelligence: 'outline',
  reach: 'secondary',
};

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  vote_count: number;
  category: string;
}

const ROADMAP_ITEMS_QUERY_KEY = ['roadmap', 'items'] as const;

function roadmapVotesQueryKey(userId: string) {
  return ['roadmap', 'votes', userId] as const;
}

async function fetchRoadmapPage(offset: number): Promise<RoadmapItem[]> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('id, title, description, status, vote_count, category')
    .order('vote_count', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (error) throw error;
  return (data as unknown as RoadmapItem[]) ?? [];
}

async function fetchRoadmapVotes(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('roadmap_votes').select('item_id').eq('user_id', userId);
  if (error) throw error;
  return data?.map((v) => v.item_id) ?? [];
}

const Roadmap = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const {
    data: itemsPages,
    isPending: itemsPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ROADMAP_ITEMS_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchRoadmapPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((sum, p) => sum + p.length, 0);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: voteIds = [], isPending: votesPending } = useQuery({
    queryKey: userId ? roadmapVotesQueryKey(userId) : ['roadmap', 'votes', 'none'],
    queryFn: () => fetchRoadmapVotes(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const votes = useMemo(() => new Set(voteIds), [voteIds]);
  const items = useMemo(() => itemsPages?.pages.flat() ?? [], [itemsPages]);

  const loading = itemsPending || (Boolean(userId) && votesPending);

  const onLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useInfiniteScroll({
    hasMore: Boolean(hasNextPage),
    loading: isFetchingNextPage,
    onLoadMore,
  });

  const toggleVote = useCallback(
    async (itemId: string) => {
      if (!userId) return;
      const hasVoted = votes.has(itemId);
      const votesKey = roadmapVotesQueryKey(userId);
      const prevVotes = queryClient.getQueryData<string[]>(votesKey);
      const prevItems = queryClient.getQueryData<InfiniteData<RoadmapItem[]>>(ROADMAP_ITEMS_QUERY_KEY);

      queryClient.setQueryData<string[]>(votesKey, (ids) => {
        const cur = ids ?? [];
        if (hasVoted) return cur.filter((id) => id !== itemId);
        return [...cur, itemId];
      });

      queryClient.setQueryData<InfiniteData<RoadmapItem[]>>(ROADMAP_ITEMS_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          pageParams: old.pageParams,
          pages: old.pages.map((page) =>
            page.map((i) =>
              i.id === itemId
                ? { ...i, vote_count: Math.max(0, hasVoted ? i.vote_count - 1 : i.vote_count + 1) }
                : i,
            ),
          ),
        };
      });

      try {
        if (hasVoted) {
          const { error } = await supabase.from('roadmap_votes').delete().eq('user_id', userId).eq('item_id', itemId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('roadmap_votes').insert({ user_id: userId, item_id: itemId });
          if (error) throw error;
        }
      } catch {
        if (prevVotes !== undefined) queryClient.setQueryData(votesKey, prevVotes);
        else void queryClient.invalidateQueries({ queryKey: votesKey });
        if (prevItems !== undefined) queryClient.setQueryData(ROADMAP_ITEMS_QUERY_KEY, prevItems);
        else void queryClient.invalidateQueries({ queryKey: ROADMAP_ITEMS_QUERY_KEY });
      }
    },
    [userId, votes, queryClient],
  );

  const filtered = useMemo(() => {
    const base = activeCategory === 'all' ? items : items.filter((i) => i.category === activeCategory);
    return [...base].sort((a, b) => b.vote_count - a.vote_count);
  }, [items, activeCategory]);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Holzen Roadmap — Vote on what we build next" description="See what's planned for Holzen and vote on features you want most. Public roadmap shaped by the community." path="/roadmap" />
      <div className="max-w-lg mx-auto px-6 py-12 space-y-8">
        <div className="space-y-4">
          <Link to={user ? '/settings' : '/welcome'} className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" />
            {t('common.back')}
          </Link>
          <PageHeading
            title={t('roadmap.title')}
            subtitle={`${t('roadmap.voteOnNext')} ${!user ? t('roadmap.signInToVote') : ''}`.trim()}
          />
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                activeCategory === cat
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-muted/40 text-muted-foreground border-border/40 hover:border-foreground/20'
              }`}
            >
              {t(`roadmap.${cat}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const voted = votes.has(item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 flex gap-3 items-start"
                >
                  <button
                    onClick={() => void toggleVote(item.id)}
                    disabled={!user}
                    className={`shrink-0 flex flex-col items-center gap-0.5 pt-0.5 transition-colors ${
                      voted ? 'text-nox-text-highlight' : 'text-muted-foreground/40 hover:text-foreground'
                    } ${!user ? 'opacity-40 cursor-not-allowed' : ''}`}
                    aria-label={voted ? 'Remove vote' : 'Upvote'}
                  >
                    <ChevronUp className={`h-3.5 w-3.5 ${voted ? 'text-nox-text-highlight' : ''}`} />
                    <span className="text-[10px] font-mono">{item.vote_count}</span>
                  </button>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-snug">{item.title}</p>
                      {item.category && (
                        <Badge variant={categoryTone[item.category] ?? 'outline'} className="text-[9px] font-mono uppercase px-1.5 py-0 h-4">
                          {t(`roadmap.${item.category}`, item.category)}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6 font-mono">
                {t('common.noResults', { defaultValue: 'No items in this category yet.' })}
              </p>
            )}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
              <p className="text-[10px] font-mono text-muted-foreground animate-pulse text-center py-2">{t('common.loadingMore')}</p>
            )}
          </div>
        )}
        <PublicFooter />
      </div>
    </div>
  );
};

export default Roadmap;
