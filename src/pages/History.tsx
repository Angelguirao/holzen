import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { format, subDays, isAfter } from 'date-fns';
import { X, Star, Search, Pin, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareReflection } from '@/components/ShareReflection';
import { ReflectionNote } from '@/components/ReflectionNote';
import { ReflectionTags } from '@/components/ReflectionTags';
import { ReflectionComparison } from '@/components/ReflectionComparison';
import { HaikuDisplay } from '@/components/HaikuDisplay';
import { LearningInput } from '@/components/LearningInput';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Reflection {
  id: string;
  message: string;
  context: string | null;
  created_at: string;
  is_favorite: boolean;
  haiku: string | null;
  learning_title: string | null;
  learning_body: string | null;
  learning_citation: string | null;
  learning_url: string | null;
  note: string | null;
  mood: string | null;
  outcome: string | null;
  tags: string[];
}

const History = () => {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'recent' | 'library'>('recent');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Holzen — History';
    return () => { document.title = 'Holzen — Pause before you act'; };
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadReflections = async () => {
      const { data } = await supabase
        .from('reflections')
        .select('id, message, context, created_at, is_favorite, haiku, learning_title, learning_body, learning_citation, learning_url, note, mood, outcome, tags')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      setReflections((data as unknown as Reflection[]) ?? []);
      setLoading(false);
    };
    loadReflections();
  }, [user]);

  const toggleFavorite = useCallback(async (id: string) => {
    const reflection = reflections.find((r) => r.id === id);
    if (!reflection) return;
    const newVal = !reflection.is_favorite;
    await supabase.from('reflections').update({ is_favorite: newVal }).eq('id', id);
    setReflections((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_favorite: newVal } : r))
    );
  }, [reflections]);

  const pinReflection = useCallback((id: string) => {
    const current = localStorage.getItem('holzen_pinned_reflection');
    if (current === id) {
      localStorage.removeItem('holzen_pinned_reflection');
      toast('Reflection unpinned');
    } else {
      localStorage.setItem('holzen_pinned_reflection', id);
      toast('Reflection pinned to Home');
    }
  }, []);

  const deleteReflection = useCallback(async (id: string) => {
    try {
      await supabase.from('reflections').delete().eq('id', id);
      setReflections((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast('Failed to delete reflection');
    }
  }, []);

  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7), []);

  const recentReflections = useMemo(
    () => reflections.filter((r) => isAfter(new Date(r.created_at), sevenDaysAgo)),
    [reflections, sevenDaysAgo]
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    reflections.forEach((r) => r.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [reflections]);

  const filtered = useMemo(() => {
    let result = filter === 'favorites' ? reflections.filter((r) => r.is_favorite) : reflections;
    if (tagFilter) {
      result = result.filter((r) => r.tags?.includes(tagFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.message.toLowerCase().includes(q) || r.context?.toLowerCase().includes(q) || r.note?.toLowerCase().includes(q) || r.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [reflections, filter, tagFilter, search]);

  const displayedReflections = tab === 'recent' ? recentReflections : filtered;

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setTab('recent')}
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${
              tab === 'recent' ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setTab('library')}
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${
              tab === 'library' ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            Library
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {tab === 'recent'
            ? `${recentReflections.length} reflection${recentReflections.length !== 1 ? 's' : ''} in the last 7 days`
            : `${reflections.length} reflection${reflections.length !== 1 ? 's' : ''} total`}
        </p>
      </div>

      {/* Library filters (only for library tab) */}
      {tab === 'library' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs font-mono transition-colors ${filter === 'all' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`text-xs font-mono transition-colors ${filter === 'favorites' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              Favorites
            </button>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                    tagFilter === tag
                      ? 'bg-primary/10 text-primary'
                      : 'border border-border/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {reflections.length > 3 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reflections…"
                className="w-full rounded-md border border-border/60 bg-muted/30 pl-8 pr-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
        </div>
      )}

      {/* Reflections list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : displayedReflections.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {tab === 'recent'
              ? 'No reflections in the last 7 days.'
              : search
                ? 'No reflections match your search.'
                : filter === 'favorites'
                  ? 'No favorites yet. Star reflections you want to keep.'
                  : "No reflections yet. They'll appear here when volatility crosses your threshold."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedReflections.map((r) => (
            <div
              key={r.id}
              className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-mono text-muted-foreground">
                  {format(new Date(r.created_at), 'MMM d, yyyy · h:mm a')}
                  {r.context && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex ml-1.5 align-middle text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[280px] text-[10px] font-mono leading-relaxed">
                          {r.context}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => pinReflection(r.id)}
                    className={`p-1 transition-colors ${
                      localStorage.getItem('holzen_pinned_reflection') === r.id
                        ? 'text-primary'
                        : 'text-muted-foreground/40 hover:text-foreground'
                    }`}
                    aria-label="Pin to Home"
                    title="Pin to Home"
                  >
                    <Pin className={`h-3 w-3 ${localStorage.getItem('holzen_pinned_reflection') === r.id ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => toggleFavorite(r.id)}
                    className={`p-1 transition-colors ${r.is_favorite ? 'text-foreground' : 'text-muted-foreground/40 hover:text-foreground'}`}
                    aria-label={r.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`h-3 w-3 ${r.is_favorite ? 'fill-current' : ''}`} />
                  </button>
                  <ShareReflection message={r.message} context={r.context} haiku={r.haiku} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors p-1"
                        aria-label="Delete reflection"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-mono text-sm">Delete reflection</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs">
                          This will permanently delete this reflection. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteReflection(r.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{r.message}</p>
              <ReflectionNote reflectionId={r.id} initialNote={r.note} />
              <ReflectionTags reflectionId={r.id} initialTags={r.tags ?? []} />
               {(r.haiku || r.learning_title) && (
                <div className="space-y-2 pt-2 border-t border-border/30">
                  {r.haiku && <HaikuDisplay haiku={r.haiku} />}
                  {r.learning_title && r.learning_body && (
                    <LearningInput
                      title={r.learning_title}
                      body={r.learning_body}
                      nudge={r.learning_citation ? {
                        title: r.learning_title,
                        body: r.learning_body,
                        citation: r.learning_citation,
                        url: r.learning_url ?? '',
                      } : undefined}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
