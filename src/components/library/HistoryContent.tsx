import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { formatBtcPrice } from '@/lib/btc';
import { format, isAfter, isBefore, startOfDay, endOfDay, isSameDay } from 'date-fns';
import {
  X, Star, Search, Pin, Info, TrendingUp, TrendingDown, Clock,
  History as HistoryIcon, ExternalLink, ArrowRight, ChevronDown,
  CalendarIcon, Filter, List, LayoutGrid, Award, Mail, Zap
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareReflection } from '@/components/ShareReflection';
import { ReflectionNote } from '@/components/ReflectionNote';
import { ReflectionWallpaper } from '@/components/ReflectionWallpaper';
import { ReflectionTags } from '@/components/ReflectionTags';
import { ReflectionComparison } from '@/components/ReflectionComparison';
import { HaikuDisplay } from '@/components/HaikuDisplay';
import { LearningInput } from '@/components/LearningInput';
import { HistoryCalendar, type CalendarActivity, type ActivityType } from '@/components/HistoryCalendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// --- Types ---

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
  signal_title: string | null;
  signal_body: string | null;
  signal_source: string | null;
  signal_url: string | null;
  zoom_out_data: any | null;
  history_insight_data: any | null;
  note: string | null;
  mood: string | null;
  outcome: string | null;
  tags: string[];
}

interface Ritual {
  id: string;
  created_at: string;
  decision: string;
  template: string;
  journal_text: string | null;
  duration_seconds: number | null;
}

interface Letter {
  id: string;
  written_at: string;
  deliver_during: string;
  btc_price_at_write: number;
  delivered: boolean;
  delivered_at: string | null;
}

interface Badge {
  id: string;
  earned_at: string;
  badge_id: string;
}

type ActivityEntry =
  | { kind: 'reflection'; date: string; data: Reflection }
  | { kind: 'ritual';     date: string; data: Ritual }
  | { kind: 'letter';     date: string; data: Letter }
  | { kind: 'badge';      date: string; data: Badge };

// --- Helpers ---

const ACTIVITY_TYPES = ['reflection', 'ritual', 'letter', 'badge'] as const;

function HistoryCompanions({ label, r }: { label: string; r: Reflection }) {
  const [open, setOpen] = useState(false);
  const { currency } = useHolzen();

  return (
    <div className="pt-2 border-t border-border/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors w-full"
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        <span className="tracking-wider uppercase">{label}</span>
      </button>
      {open && (
        <div className="space-y-3 pt-2.5">
          {r.haiku && <HaikuDisplay haiku={r.haiku} />}
          {r.learning_title && r.learning_body && (
            <LearningInput
              title={r.learning_title}
              body={r.learning_body}
              nudge={r.learning_citation ? { title: r.learning_title, body: r.learning_body, citation: r.learning_citation, url: r.learning_url ?? '' } : undefined}
            />
          )}
          {r.signal_source && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Signal</p>
              {r.signal_title && <p className="text-xs font-medium leading-snug">{r.signal_title}</p>}
              {r.signal_body && <p className="text-xs text-muted-foreground leading-relaxed">{r.signal_body}</p>}
              {r.signal_url && (
                <a href={r.signal_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-mono text-primary/70 hover:text-primary transition-colors">
                  <ExternalLink className="h-2.5 w-2.5" />
                  {r.signal_source}
                </a>
              )}
            </div>
          )}
          {r.zoom_out_data && (
            <div className="space-y-2">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Zoom out</p>
              {r.zoom_out_data.onThisDay?.length > 0 && r.zoom_out_data.currentPrice && (
                <div className="space-y-1">
                  {[...r.zoom_out_data.onThisDay].reverse().map((entry: any) => {
                    const changePct = ((r.zoom_out_data.currentPrice - entry.price) / entry.price) * 100;
                    const isUp = changePct >= 0;
                    return (
                      <div key={entry.yearsAgo} className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground/60 w-14 shrink-0">{entry.yearsAgo}y ago</span>
                        <span className="text-xs font-mono text-muted-foreground tabular-nums">{formatBtcPrice(entry.price, currency)}</span>
                        <span className={`text-[10px] font-mono tabular-nums ${isUp ? 'text-primary/70' : 'text-destructive/70'}`}>
                          {isUp ? '+' : ''}{changePct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {r.zoom_out_data.echo && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground/50" />
                    <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                      Echo{r.zoom_out_data.echo.created_at ? ` · ${format(new Date(r.zoom_out_data.echo.created_at), 'MMM d, yyyy')}` : ''}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-2">"{r.zoom_out_data.echo.message}"</p>
                </div>
              )}
            </div>
          )}
          {r.history_insight_data && (
            <div className="space-y-2">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Historical insight</p>
              <p className="text-xs font-mono font-medium leading-relaxed">{r.history_insight_data.title}</p>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <HistoryIcon className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                  <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Bitcoin · {r.history_insight_data.period}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{r.history_insight_data.btcInsight}</p>
              </div>
              <div className="space-y-1 pl-3 border-l-2 border-border/40">
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
                  <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">{r.history_insight_data.assetClass} parallel</p>
                </div>
                <p className="text-xs text-muted-foreground/80 leading-relaxed italic">{r.history_insight_data.analogy}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Activity cards for non-reflection types ---

function RitualCard({ data }: { data: Ritual }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <Zap className="h-3 w-3 text-primary/60" />
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Ritual · {data.template}
        </p>
        <span className="text-[10px] font-mono text-muted-foreground/40 ml-auto">
          {format(new Date(data.created_at), 'MMM d, yyyy · h:mm a')}
        </span>
      </div>
      <p className="text-sm leading-relaxed capitalize">Decision: {data.decision}</p>
      {data.journal_text && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{data.journal_text}</p>
      )}
      {data.duration_seconds && (
        <p className="text-[10px] font-mono text-muted-foreground/40">
          {Math.round(data.duration_seconds / 60)}m {data.duration_seconds % 60}s
        </p>
      )}
    </div>
  );
}

function LetterCard({ data }: { data: Letter }) {
  const { currency } = useHolzen();
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <Mail className="h-3 w-3 text-primary/60" />
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Letter to future self
        </p>
        <span className="text-[10px] font-mono text-muted-foreground/40 ml-auto">
          {format(new Date(data.written_at), 'MMM d, yyyy · h:mm a')}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Delivers during next {data.deliver_during === 'surge' ? 'surge' : 'drop'}
        {' · '}Written at {formatBtcPrice(data.btc_price_at_write, currency)}
      </p>
      {data.delivered && data.delivered_at && (
        <p className="text-[10px] font-mono text-primary/70">
          ✓ Delivered {format(new Date(data.delivered_at), 'MMM d, yyyy')}
        </p>
      )}
    </div>
  );
}

function BadgeCard({ data }: { data: Badge }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <Award className="h-3 w-3 text-primary/60" />
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Badge earned
        </p>
        <span className="text-[10px] font-mono text-muted-foreground/40 ml-auto">
          {format(new Date(data.earned_at), 'MMM d, yyyy · h:mm a')}
        </span>
      </div>
      <p className="text-sm mt-1 capitalize">{data.badge_id.replace(/-/g, ' ')}</p>
    </div>
  );
}

// --- Main component ---

const REFLECTION_FIELDS = 'id, message, context, created_at, is_favorite, haiku, learning_title, learning_body, learning_citation, learning_url, signal_title, signal_body, signal_source, signal_url, zoom_out_data, history_insight_data, note, mood, outcome, tags';

interface HistoryContentProps {
  viewMode?: 'list' | 'calendar';
  onViewModeChange?: (mode: 'list' | 'calendar') => void;
}

const HistoryContent = ({ viewMode: externalViewMode, onViewModeChange }: HistoryContentProps = {}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useHolzen();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'calendar'>('list');
  const viewMode = externalViewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;
  const [typeFilter, setTypeFilter] = useState<'all' | 'reflection' | 'ritual' | 'letter' | 'badge'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);
  const [calendarFilters, setCalendarFilters] = useState<Set<ActivityType>>(new Set(['reflection', 'ritual', 'letter', 'badge']));

  // Load all data
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: refData }, { data: ritData }, { data: letData }, { data: badData }] = await Promise.all([
        supabase.from('reflections').select(REFLECTION_FIELDS).eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
        supabase.from('ritual_completions').select('id, created_at, decision, template, journal_text, duration_seconds').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('future_letters').select('id, written_at, deliver_during, btc_price_at_write, delivered, delivered_at').eq('user_id', user.id).order('written_at', { ascending: false }),
        supabase.from('user_badges').select('id, earned_at, badge_id').eq('user_id', user.id).order('earned_at', { ascending: false }),
      ]);
      setReflections((refData as unknown as Reflection[]) ?? []);
      setRituals((ritData as unknown as Ritual[]) ?? []);
      setLetters((letData as unknown as Letter[]) ?? []);
      setBadges((badData as unknown as Badge[]) ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  // Build unified activity list
  const allActivities = useMemo<ActivityEntry[]>(() => {
    const entries: ActivityEntry[] = [];
    reflections.forEach((r) => entries.push({ kind: 'reflection', date: r.created_at, data: r }));
    rituals.forEach((r) => entries.push({ kind: 'ritual', date: r.created_at, data: r }));
    letters.forEach((l) => entries.push({ kind: 'letter', date: l.written_at, data: l }));
    badges.forEach((b) => entries.push({ kind: 'badge', date: b.earned_at, data: b }));
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  }, [reflections, rituals, letters, badges]);

  // Calendar activities
  const calendarActivities = useMemo<CalendarActivity[]>(() => {
    return allActivities.map((a) => ({
      date: a.date,
      type: a.kind as ActivityType,
      id: a.data.id,
      mood: a.kind === 'reflection' ? (a.data as Reflection).mood ?? undefined : undefined,
      label: a.kind === 'ritual' ? `${(a.data as Ritual).template} · ${(a.data as Ritual).decision}` :
             a.kind === 'letter' ? `Letter → ${(a.data as Letter).deliver_during}` :
             a.kind === 'badge' ? (a.data as Badge).badge_id : undefined,
    }));
  }, [allActivities]);

  const toggleCalendarFilter = useCallback((type: ActivityType) => {
    setCalendarFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const reflection = reflections.find((r) => r.id === id);
    if (!reflection) return;
    const newVal = !reflection.is_favorite;
    await supabase.from('reflections').update({ is_favorite: newVal }).eq('id', id);
    setReflections((prev) => prev.map((r) => (r.id === id ? { ...r, is_favorite: newVal } : r)));
  }, [reflections]);

  const pinReflection = useCallback((id: string) => {
    const current = localStorage.getItem('holzen_pinned_reflection');
    if (current === id) { localStorage.removeItem('holzen_pinned_reflection'); toast('Reflection unpinned'); }
    else { localStorage.setItem('holzen_pinned_reflection', id); toast('Reflection pinned to Home'); }
  }, []);

  const deleteReflection = useCallback(async (id: string) => {
    try {
      await supabase.from('reflections').delete().eq('id', id);
      setReflections((prev) => prev.filter((r) => r.id !== id));
    } catch { toast('Failed to delete reflection'); }
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    reflections.forEach((r) => r.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [reflections]);

  const moods = ['fomo', 'excited', 'greedy', 'anxious', 'calm', 'detached', 'uncertain', 'fearful'] as const;

  // Filter activities
  const filtered = useMemo(() => {
    let result = allActivities;
    if (typeFilter !== 'all') result = result.filter((a) => a.kind === typeFilter);
    if (moodFilter) result = result.filter((a) => a.kind === 'reflection' && (a.data as Reflection).mood === moodFilter);
    if (tagFilter) result = result.filter((a) => a.kind === 'reflection' && (a.data as Reflection).tags?.includes(tagFilter));
    if (dateFrom) result = result.filter((a) => isAfter(new Date(a.date), startOfDay(dateFrom)));
    if (dateTo) result = result.filter((a) => isBefore(new Date(a.date), endOfDay(dateTo)));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => {
        if (a.kind === 'reflection') {
          const r = a.data as Reflection;
          return r.message.toLowerCase().includes(q) || r.context?.toLowerCase().includes(q) || r.note?.toLowerCase().includes(q) || r.tags?.some((t) => t.toLowerCase().includes(q));
        }
        if (a.kind === 'ritual') return (a.data as Ritual).journal_text?.toLowerCase().includes(q) || (a.data as Ritual).decision.toLowerCase().includes(q);
        if (a.kind === 'badge') return (a.data as Badge).badge_id.toLowerCase().includes(q);
        return false;
      });
    }
    if (viewMode === 'calendar' && calendarDate) {
      result = result.filter((a) => isSameDay(new Date(a.date), calendarDate));
    }
    return result;
  }, [allActivities, typeFilter, moodFilter, tagFilter, dateFrom, dateTo, search, viewMode, calendarDate]);

  const hasActiveFilters = !!tagFilter || !!moodFilter || !!dateFrom || !!dateTo || typeFilter !== 'all';

  const clearAllFilters = useCallback(() => {
    setTypeFilter('all');
    setTagFilter(null);
    setMoodFilter(null);
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearch('');
  }, []);

  // Render a single activity entry
  const renderEntry = (entry: ActivityEntry) => {
    switch (entry.kind) {
      case 'ritual': return <RitualCard key={`rit-${entry.data.id}`} data={entry.data as Ritual} />;
      case 'letter': return <LetterCard key={`let-${entry.data.id}`} data={entry.data as Letter} />;
      case 'badge':  return <BadgeCard key={`bdg-${entry.data.id}`} data={entry.data as Badge} />;
      case 'reflection': {
        const r = entry.data as Reflection;
        return (
          <div key={r.id} className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-mono text-muted-foreground">
                {format(new Date(r.created_at), 'MMM d, yyyy · h:mm a')}
                {r.mood && <span className="ml-1.5 capitalize text-muted-foreground/60">· {r.mood}</span>}
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
                <button onClick={() => pinReflection(r.id)} className={`p-1 transition-colors ${localStorage.getItem('holzen_pinned_reflection') === r.id ? 'text-primary' : 'text-muted-foreground/40 hover:text-foreground'}`} aria-label="Pin to Home">
                  <Pin className={`h-3 w-3 ${localStorage.getItem('holzen_pinned_reflection') === r.id ? 'fill-current' : ''}`} />
                </button>
                <button onClick={() => toggleFavorite(r.id)} className={`p-1 transition-colors ${r.is_favorite ? 'text-foreground' : 'text-muted-foreground/40 hover:text-foreground'}`}>
                  <Star className={`h-3 w-3 ${r.is_favorite ? 'fill-current' : ''}`} />
                </button>
                <ShareReflection message={r.message} context={r.context} haiku={r.haiku} />
                <ReflectionWallpaper message={r.message} mood={r.mood} context={r.context} haiku={r.haiku} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors p-1" aria-label="Delete reflection">
                      <X className="h-3 w-3" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-mono text-sm">{t('history.deleteReflection')}</AlertDialogTitle>
                      <AlertDialogDescription className="text-xs">{t('history.deleteReflectionDesc')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-mono text-xs">{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteReflection(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs">
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{r.message}</p>
            {r.outcome && <p className="text-[10px] font-mono text-muted-foreground/50 capitalize">→ {r.outcome}</p>}
            <ReflectionNote reflectionId={r.id} initialNote={r.note} />
            <ReflectionTags reflectionId={r.id} initialTags={r.tags ?? []} />
            {(() => {
              const items: string[] = [];
              if (r.haiku) items.push('Haiku');
              if (r.learning_title) items.push('Learning');
              if (r.signal_source) items.push('Signal');
              if (r.zoom_out_data) items.push('Zoom Out');
              if (r.history_insight_data) items.push('History');
              if (items.length === 0) return null;
              return <HistoryCompanions label={`${items.length} companion${items.length !== 1 ? 's' : ''}`} r={r} />;
            })()}
            <ReflectionComparison reflectionId={r.id} />
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-mono">
          {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
        </p>
        <div className="flex items-center gap-1 rounded-md border border-border/40 p-0.5">
          <button onClick={() => { setViewMode('list'); setCalendarDate(null); }} className={cn('p-1 rounded transition-colors', viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground')} aria-label="List view">
            <List className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setViewMode('calendar')} className={cn('p-1 rounded transition-colors', viewMode === 'calendar' ? 'bg-muted text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground')} aria-label="Calendar view">
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search + type filters */}
      <div className="space-y-3">
        {allActivities.length > 3 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('history.searchReflections')}
              className="w-full rounded-md border border-border/60 bg-muted/30 pl-8 pr-8 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Type filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', ...ACTIVITY_TYPES] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                'text-[10px] font-mono px-2 py-1 rounded capitalize transition-colors',
                typeFilter === type ? 'bg-primary/10 text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
              )}
            >
              {type === 'all' ? t('history.all') : type === 'reflection' ? 'Reflections' : type === 'ritual' ? 'Rituals' : type === 'letter' ? 'Letters' : 'Badges'}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-[10px] font-mono transition-colors ${showFilters || hasActiveFilters ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Filter className="h-3 w-3" />
            {t('history.filters')}
            {hasActiveFilters && (
              <span className="h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center">
                {[tagFilter, moodFilter, dateFrom, dateTo, typeFilter !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3">
            {/* Date range */}
            <div className="space-y-1.5">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">{t('history.dateRange')}</p>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn("flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1.5 text-[10px] font-mono transition-colors", dateFrom ? "text-foreground" : "text-muted-foreground/50")}>
                      <CalendarIcon className="h-3 w-3" />
                      {dateFrom ? format(dateFrom, 'MMM d, yyyy') : t('common.from')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} disabled={(date) => date > new Date() || (dateTo ? date > dateTo : false)} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                <span className="text-[10px] text-muted-foreground/40">→</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn("flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1.5 text-[10px] font-mono transition-colors", dateTo ? "text-foreground" : "text-muted-foreground/50")}>
                      <CalendarIcon className="h-3 w-3" />
                      {dateTo ? format(dateTo, 'MMM d, yyyy') : t('common.until')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} disabled={(date) => date > new Date() || (dateFrom ? date < dateFrom : false)} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(undefined); setDateTo(undefined); }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Mood filter */}
            <div className="space-y-1.5">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">{t('history.mood')}</p>
              <div className="flex flex-wrap gap-1">
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMoodFilter(moodFilter === m ? null : m)}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize transition-colors ${moodFilter === m ? 'bg-primary/10 text-primary' : 'border border-border/60 text-muted-foreground hover:text-foreground'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">{t('history.tags')}</p>
                <div className="flex flex-wrap gap-1">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${tagFilter === tag ? 'bg-primary/10 text-primary' : 'border border-border/60 text-muted-foreground hover:text-foreground'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                {t('history.clearAllFilters')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Calendar view */}
      {viewMode === 'calendar' ? (
        <div className="space-y-4">
          <HistoryCalendar
            activities={calendarActivities}
            selectedDate={calendarDate}
            onSelectDate={setCalendarDate}
            activeFilters={calendarFilters}
            onToggleFilter={toggleCalendarFilter}
          />
          {calendarDate && filtered.length > 0 && (
            <div className="space-y-3">{filtered.map(renderEntry)}</div>
          )}
          {calendarDate && filtered.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-xs text-muted-foreground/50 italic">No activity on this day.</p>
            </div>
          )}
        </div>
      ) : loading ? (
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
            {search ? t('history.noReflectionsSearch') : t('history.noReflectionsYet')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(renderEntry)}
        </div>
      )}
    </div>
  );
};

export default HistoryContent;
