import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageMeta } from '@/components/PageMeta';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';

const PAGE_SIZE = 30;

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  vote_count: number;
}

const Roadmap = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [votes, setVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('roadmap_items')
        .select('id, title, description, status, vote_count')
        .order('vote_count', { ascending: false })
        .limit(PAGE_SIZE);

      const rows = (data as unknown as RoadmapItem[]) ?? [];
      setItems(rows);
      setHasMore(rows.length === PAGE_SIZE);

      if (user) {
        const { data: userVotes } = await supabase
          .from('roadmap_votes')
          .select('item_id')
          .eq('user_id', user.id);
        setVotes(new Set(userVotes?.map((v) => v.item_id) ?? []));
      }

      setLoading(false);
    };
    load();
  }, [user]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { data } = await supabase
      .from('roadmap_items')
      .select('id, title, description, status, vote_count')
      .order('vote_count', { ascending: false })
      .range(items.length, items.length + PAGE_SIZE - 1);
    const rows = (data as unknown as RoadmapItem[]) ?? [];
    setItems((prev) => [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, items.length]);

  const sentinelRef = useInfiniteScroll({ hasMore, loading: loadingMore, onLoadMore: loadMore });

  const toggleVote = useCallback(async (itemId: string) => {
    if (!user) return;
    const hasVoted = votes.has(itemId);

    if (hasVoted) {
      await supabase.from('roadmap_votes').delete().eq('user_id', user.id).eq('item_id', itemId);
      setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, vote_count: Math.max(0, i.vote_count - 1) } : i));
      setVotes((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
    } else {
      await supabase.from('roadmap_votes').insert({ user_id: user.id, item_id: itemId });
      setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, vote_count: i.vote_count + 1 } : i));
      setVotes((prev) => new Set(prev).add(itemId));
    }
  }, [user, votes]);

  const sorted = [...items].sort((a, b) => b.vote_count - a.vote_count);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Holzen Roadmap — Vote on what we build next" description="See what's planned for Holzen and vote on features you want most. Public roadmap shaped by the community." path="/roadmap" />
      <div className="max-w-lg mx-auto px-6 py-12 space-y-8">
        <div className="space-y-4">
          <Link to={user ? '/settings' : '/welcome'} className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" />
            Back
          </Link>
          <div className="space-y-1">
            <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">Roadmap</h1>
            <p className="text-xs text-muted-foreground">
              Vote on what we build next. {!user && 'Sign in to vote.'}
            </p>
          </div>
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
            {sorted.map((item) => {
              const voted = votes.has(item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 flex gap-3 items-start"
                >
                  <button
                    onClick={() => toggleVote(item.id)}
                    disabled={!user}
                    className={`shrink-0 flex flex-col items-center gap-0.5 pt-0.5 transition-colors ${
                      voted ? 'text-primary' : 'text-muted-foreground/40 hover:text-foreground'
                    } ${!user ? 'opacity-40 cursor-not-allowed' : ''}`}
                    aria-label={voted ? 'Remove vote' : 'Upvote'}
                  >
                    <ChevronUp className={`h-3.5 w-3.5 ${voted ? 'text-primary' : ''}`} />
                    <span className="text-[10px] font-mono">{item.vote_count}</span>
                  </button>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && (
              <p className="text-[10px] font-mono text-muted-foreground animate-pulse text-center py-2">Loading more…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Roadmap;
