import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { X, Star, Search, Mail, Lock, Clock, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareReflection } from '@/components/ShareReflection';
import { ReflectionNote } from '@/components/ReflectionNote';
import { InsightsPanel } from '@/components/InsightsPanel';
import { MoodTrends } from '@/components/MoodTrends';
import { useHolzenScore } from '@/hooks/use-holzen-score';
import { ReflectionStats } from '@/components/ReflectionStats';
import { ReflectionTags } from '@/components/ReflectionTags';
import { HaikuDisplay } from '@/components/HaikuDisplay';
import { LearningInput } from '@/components/LearningInput';
import { BadgesPanel } from '@/components/BadgesPanel';
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
  note: string | null;
  mood: string | null;
  outcome: string | null;
  tags: string[];
}

interface Letter {
  id: string;
  body: string;
  written_during: string;
  deliver_during: string;
  btc_price_at_write: number;
  written_at: string;
  delivered: boolean;
  delivered_at: string | null;
  btc_price_at_delivery: number | null;
}

const History = () => {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [lettersLoading, setLettersLoading] = useState(true);
  const [tab, setTab] = useState<'reflections' | 'letters' | 'insights' | 'badges'>('reflections');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Holzen — Reflections';
    return () => { document.title = 'Holzen — Pause before you act'; };
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadReflections = async () => {
      const { data } = await supabase
        .from('reflections')
        .select('id, message, context, created_at, is_favorite, haiku, learning_title, learning_body, note, mood, outcome, tags')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      setReflections((data as unknown as Reflection[]) ?? []);
      setLoading(false);
    };
    const loadLetters = async () => {
      const { data } = await supabase
        .from('future_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('written_at', { ascending: false });
      setLetters((data as unknown as Letter[]) ?? []);
      setLettersLoading(false);
    };
    loadReflections();
    loadLetters();
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

  const deleteReflection = useCallback(async (id: string) => {
    try {
      await supabase.from('reflections').delete().eq('id', id);
      setReflections((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast('Failed to delete reflection');
    }
  }, []);

  const deleteLetter = useCallback(async (id: string) => {
    try {
      await supabase.from('future_letters').delete().eq('id', id);
      setLetters((prev) => prev.filter((l) => l.id !== id));
      toast('Letter deleted');
    } catch {
      toast('Failed to delete letter');
    }
  }, []);

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

  const pendingLetters = useMemo(() => letters.filter((l) => !l.delivered), [letters]);
  const deliveredLetters = useMemo(() => letters.filter((l) => l.delivered), [letters]);

  const fmtPrice = (p: number) =>
    p.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setTab('reflections')}
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${
              tab === 'reflections' ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            Reflections
          </button>
          <button
            onClick={() => setTab('letters')}
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${
              tab === 'letters' ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            Letters
            {pendingLetters.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {pendingLetters.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('insights')}
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${
              tab === 'insights' ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            Insights
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {tab === 'letters'
            ? `${letters.length} letter${letters.length !== 1 ? 's' : ''} total`
            : `${reflections.length} reflection${reflections.length !== 1 ? 's' : ''} total`}
        </p>
      </div>

      {tab === 'letters' ? (
        /* Letters Tab */
        lettersLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        ) : letters.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Mail className="h-5 w-5 mx-auto text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              No letters yet. Write one during a ±5% market swing from the home page.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sealed / Pending */}
            {pendingLetters.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <p className="text-[10px] font-mono tracking-widest uppercase">
                    Sealed ({pendingLetters.length})
                  </p>
                </div>
                {pendingLetters.map((l) => (
                  <div key={l.id} className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        <span>
                          Written {format(new Date(l.written_at), 'MMM d, yyyy')} during{' '}
                          {l.written_during === 'crash' ? 'a drop' : 'a surge'} at{' '}
                          {fmtPrice(l.btc_price_at_write)}
                        </span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors p-1" aria-label="Delete letter">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-mono text-sm">Delete sealed letter</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs">
                              This will permanently delete this letter. It will never be delivered. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteLetter(l.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <p className="text-xs text-muted-foreground/50">
                      Delivers during next {l.deliver_during === 'ath' ? 'surge' : 'drop'}
                    </p>
                    <p className="text-sm leading-relaxed blur-sm hover:blur-none transition-all duration-300 cursor-pointer select-none" title="Hover to peek">
                      {l.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Delivered */}
            {deliveredLetters.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <p className="text-[10px] font-mono tracking-widest uppercase">
                    Delivered ({deliveredLetters.length})
                  </p>
                </div>
                {deliveredLetters.map((l) => (
                  <div key={l.id} className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-primary" />
                        <p className="text-[10px] font-mono text-primary uppercase tracking-wider">
                          Delivered {l.delivered_at ? format(new Date(l.delivered_at), 'MMM d, yyyy') : ''}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors p-1" aria-label="Delete letter">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-mono text-sm">Delete delivered letter</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs">
                              This will permanently delete this letter. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteLetter(l.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <p className="text-sm leading-relaxed">{l.body}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/50">
                      Written {format(new Date(l.written_at), 'MMM d, yyyy')} at {fmtPrice(l.btc_price_at_write)}
                      {l.btc_price_at_delivery && ` · Delivered at ${fmtPrice(l.btc_price_at_delivery)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : tab === 'insights' ? (
        /* Insights Tab */
        loading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ) : reflections.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">
            No reflections yet. Insights will appear after your first reflection.
          </p>
        ) : (
          <InsightsWithScore reflections={reflections} />
        )
      ) : (
        /* Library Tab */
        <>
          {/* Filter & Search */}
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
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                {search
                  ? 'No reflections match your search.'
                  : filter === 'favorites'
                    ? 'No favorites yet. Star reflections you want to keep.'
                    : "No reflections yet. They'll appear here when volatility crosses your threshold."}
              </p>
            </div>
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
                        <LearningInput title={r.learning_title} body={r.learning_body} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

function InsightsWithScore({ reflections }: { reflections: { created_at: string; mood: string | null; outcome: string | null; message: string; context: string | null; is_favorite: boolean; haiku: string | null; learning_title: string | null; learning_body: string | null; note: string | null; tags: string[]; id: string }[] }) {
  const scoreData = useHolzenScore(reflections);

  return (
    <div className="space-y-5">
      <ReflectionStats reflections={reflections} />
      {scoreData && <HolzenScoreDetail scoreData={scoreData} />}
      <MoodTrends reflections={reflections} />
      <InsightsPanel reflections={reflections} />
    </div>
  );
}

function HolzenScoreDetail({ scoreData }: { scoreData: import('@/hooks/use-holzen-score').HolzenScoreData }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (scoreData.score / 100) * circumference;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Holzen Score</p>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="4" opacity="0.3" />
            <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 44 44)" className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-mono font-medium">{scoreData.score}</span>
          </div>
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          <ScoreBarInline label="Mood" value={scoreData.moodScore} />
          <ScoreBarInline label="Actions" value={scoreData.outcomeScore} />
          <ScoreBarInline label="Streak" value={scoreData.streakScore} />
        </div>
      </div>
    </div>
  );
}

function ScoreBarInline({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
        <div className="h-full rounded-full bg-primary/60 transition-all duration-700 ease-out" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default History;
