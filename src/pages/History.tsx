import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { X, Star } from 'lucide-react';
import { ShareReflection } from '@/components/ShareReflection';
import { HaikuDisplay } from '@/components/HaikuDisplay';
import { LearningInput } from '@/components/LearningInput';

interface Reflection {
  id: string;
  message: string;
  context: string | null;
  created_at: string;
  is_favorite: boolean;
  haiku: string | null;
  learning_title: string | null;
  learning_body: string | null;
}

const History = () => {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('reflections')
        .select('id, message, context, created_at, is_favorite, haiku, learning_title, learning_body')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setReflections((data as unknown as Reflection[]) ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleFavorite = useCallback(async (id: string) => {
    const reflection = reflections.find((r) => r.id === id);
    if (!reflection) return;
    const newVal = !reflection.is_favorite;
    await supabase.from('reflections').update({ is_favorite: newVal } as any).eq('id', id);
    setReflections((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_favorite: newVal } : r))
    );
  }, [reflections]);

  const deleteReflection = useCallback(async (id: string) => {
    await supabase.from('reflections').delete().eq('id', id);
    setReflections((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const filtered = filter === 'favorites' ? reflections.filter((r) => r.is_favorite) : reflections;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
          Past reflections
        </h1>
        <p className="text-xs text-muted-foreground">
          {reflections.length} reflection{reflections.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Filter */}
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

      {loading ? (
        <p className="text-xs font-mono text-muted-foreground">Loading</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {filter === 'favorites' ? 'No favorites yet. Star reflections you want to keep.' : "No reflections yet. They'll appear here when volatility crosses your threshold."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-mono text-muted-foreground">
                  {format(new Date(r.created_at), 'MMM d, yyyy · h:mm a')}
                  {r.context && ` — ${r.context}`}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleFavorite(r.id)}
                    className={`p-1 transition-colors ${r.is_favorite ? 'text-foreground' : 'text-muted-foreground/40 hover:text-foreground'}`}
                    aria-label={r.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`h-3 w-3 ${r.is_favorite ? 'fill-current' : ''}`} />
                  </button>
                  <ShareReflection message={r.message} context={r.context} />
                  <button
                    onClick={() => deleteReflection(r.id)}
                    className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors p-1"
                    aria-label="Delete reflection"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{r.message}</p>
              {(r.haiku || r.learning_title) && (
                <div className="space-y-2 pt-2 border-t border-border/30">
                  {r.haiku && <HaikuDisplay haiku={r.haiku} />}
                  {r.learning_title && r.learning_body && (
                    <LearningInput title={r.learning_title} body={r.learning_body} />
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
