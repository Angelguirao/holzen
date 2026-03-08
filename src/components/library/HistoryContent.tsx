import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { formatBtcPrice } from '@/lib/btc';
import { format, isAfter, isBefore, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { X, Star, Search, Pin, Info, TrendingUp, TrendingDown, Clock, History as HistoryIcon, ExternalLink, ArrowRight, ChevronDown, CalendarIcon, Filter, List, LayoutGrid } from 'lucide-react';
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

const PAGE_SIZE = 30;
const FIELDS = 'id, message, context, created_at, is_favorite, haiku, learning_title, learning_body, learning_citation, learning_url, signal_title, signal_body, signal_source, signal_url, zoom_out_data, history_insight_data, note, mood, outcome, tags';

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
              nudge={r.learning_citation ? {
                title: r.learning_title,
                body: r.learning_body,
                citation: r.learning_citation,
                url: r.learning_url ?? '',
              } : undefined}
            />
          )}

          {r.signal_source && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Signal</p>
              {r.signal_title && <p className="text-xs font-medium leading-snug">{r.signal_title}</p>}
              {r.signal_body && <p className="text-xs text-muted-foreground leading-relaxed">{r.signal_body}</p>}
              {r.signal_url && (
                <a
                  href={r.signal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
                >
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
                  <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-2">
                    "{r.zoom_out_data.echo.message}"
                  </p>
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

interface HistoryContentProps {
  viewMode?: 'list' | 'calendar';
  onViewModeChange?: (mode: 'list' | 'calendar') => void;
}

const HistoryContent = ({ viewMode: externalViewMode, onViewModeChange }: HistoryContentProps = {}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useHolzen();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'calendar'>('list');
  const viewMode = externalViewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);
  const [calendarFilters, setCalendarFilters] = useState<Set<ActivityType>>(new Set(['reflection', 'ritual', 'letter', 'badge']));
  const [calendarActivities, setCalendarActivities] = useState<CalendarActivity[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadReflections = async () => {
      const { data } = await supabase
        .from('reflections')
        .select(FIELDS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      const rows = (data as unknown as Reflection[]) ?? [];
      setReflections(rows);
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
    };
    loadReflections();
  }, [user]);

  // Load calendar activities
  useEffect(() => {
    if (!user) return;
    const loadActivities = async () => {
      const [{ data: allReflections }, { data: rituals }, { data: letters }, { data: badges }] = await Promise.all([
        supabase.from('reflections').select('id, created_at, mood').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('ritual_completions').select('id, created_at, decision, template').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('future_letters').select('id, written_at, deliver_during').eq('user_id', user.id).order('written_at', { ascending: false }),
        supabase.from('user_badges').select('id, earned_at, badge_id').eq('user_id', user.id).order('earned_at', { ascending: false }),
      ]);

      const activities: CalendarActivity[] = [];
      (allReflections ?? []).forEach((r: any) => {
        activities.push({ date: r.created_at, type: 'reflection', mood: r.mood, id: r.id });
      });
      (rituals ?? []).forEach((r: any) => {
        activities.push({ date: r.created_at, type: 'ritual', id: r.id, label: `${r.template} · ${r.decision}` });
      });
      (letters ?? []).forEach((l: any) => {
        activities.push({ date: l.written_at, type: 'letter', id: l.id, label: `Letter → ${l.deliver_during}` });
      });
      (badges ?? []).forEach((b: any) => {
        activities.push({ date: b.earned_at, type: 'badge', id: b.id, label: b.badge_id });
      });
      setCalendarActivities(activities);
    };
    loadActivities();
  }, [user]);

  const toggleCalendarFilter = useCallback((type: ActivityType) => {
    setCalendarFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (!user || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const last = reflections[reflections.length - 1];
    if (!last) { setLoadingMore(false); return; }
    const { data } = await supabase
      .from('reflections')
      .select(FIELDS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .lt('created_at', last.created_at)
      .limit(PAGE_SIZE);
    const rows = (data as unknown as Reflection[]) ?? [];
    setReflections((prev) => [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [user, loadingMore, hasMore, reflections]);

  const sentinelRef = useInfiniteScroll({ hasMore, loading: loadingMore, onLoadMore: loadMore });

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

  const allTags = useMemo(() => {
    const set = new Set<string>();
    reflections.forEach((r) => r.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [reflections]);

  const moods = ['fomo', 'excited', 'greedy', 'anxious', 'calm', 'detached', 'uncertain', 'fearful'] as const;

  const filtered = useMemo(() => {
    let result = filter === 'favorites' ? reflections.filter((r) => r.is_favorite) : reflections;
    if (tagFilter) result = result.filter((r) => r.tags?.includes(tagFilter));
    if (moodFilter) result = result.filter((r) => r.mood === moodFilter);
    if (dateFrom) result = result.filter((r) => isAfter(new Date(r.created_at), startOfDay(dateFrom)));
    if (dateTo) result = result.filter((r) => isBefore(new Date(r.created_at), endOfDay(dateTo)));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.message.toLowerCase().includes(q) || r.context?.toLowerCase().includes(q) || r.note?.toLowerCase().includes(q) || r.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (viewMode === 'calendar' && calendarDate) {
      result = result.filter((r) => isSameDay(new Date(r.created_at), calendarDate));
    }
    return result;
  }, [reflections, filter, tagFilter, moodFilter, dateFrom, dateTo, search, viewMode, calendarDate]);

  const hasActiveFilters = !!tagFilter || !!moodFilter || !!dateFrom || !!dateTo || filter === 'favorites';

  const clearAllFilters = useCallback(() => {
    setFilter('all');
    setTagFilter(null);
    setMoodFilter(null);
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearch('');
  }, []);

  return (
    <div className="space-y-4">
      {/* Header row: count + view toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-mono">
          {t('history.reflectionsOf', { filtered: filtered.length, total: reflections.length, count: reflections.length })}
        </p>
        <div className="flex items-center gap-1 rounded-md border border-border/40 p-0.5">
          <button
            onClick={() => { setViewMode('list'); setCalendarDate(null); }}
            className={cn(
              'p-1 rounded transition-colors',
              viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
            )}
            aria-label="List view"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              'p-1 rounded transition-colors',
              viewMode === 'calendar' ? 'bg-muted text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
            )}
            aria-label="Calendar view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        {reflections.length > 3 && (
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

        <div className="flex items-center gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs font-mono transition-colors ${filter === 'all' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {t('history.all')}
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`text-xs font-mono transition-colors ${filter === 'favorites' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {t('history.favorites')}
            </button>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-[10px] font-mono transition-colors ${
              showFilters || hasActiveFilters ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Filter className="h-3 w-3" />
            {t('history.filters')}
            {hasActiveFilters && (
              <span className="h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center">
                {[tagFilter, moodFilter, dateFrom, dateTo, filter === 'favorites'].filter(Boolean).length}
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
                    <button className={cn(
                      "flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1.5 text-[10px] font-mono transition-colors",
                      dateFrom ? "text-foreground" : "text-muted-foreground/50"
                    )}>
                      <CalendarIcon className="h-3 w-3" />
                      {dateFrom ? format(dateFrom, 'MMM d, yyyy') : t('common.from')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      disabled={(date) => date > new Date() || (dateTo ? date > dateTo : false)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-[10px] text-muted-foreground/40">→</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1.5 text-[10px] font-mono transition-colors",
                      dateTo ? "text-foreground" : "text-muted-foreground/50"
                    )}>
                      <CalendarIcon className="h-3 w-3" />
                      {dateTo ? format(dateTo, 'MMM d, yyyy') : t('common.until')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      disabled={(date) => date > new Date() || (dateFrom ? date < dateFrom : false)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
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
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize transition-colors ${
                      moodFilter === m
                        ? 'bg-primary/10 text-primary'
                        : 'border border-border/60 text-muted-foreground hover:text-foreground'
                    }`}
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
              </div>
            )}

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
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
            <div className="space-y-3">
              {filtered.map((r) => (
                <div key={r.id} className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-mono text-muted-foreground">
                      {format(new Date(r.created_at), 'h:mm a')}
                      {r.mood && <span className="ml-1.5 capitalize text-muted-foreground/60">· {r.mood}</span>}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleFavorite(r.id)}
                        className={`p-1 transition-colors ${r.is_favorite ? 'text-foreground' : 'text-muted-foreground/40 hover:text-foreground'}`}
                      >
                        <Star className={`h-3 w-3 ${r.is_favorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{r.message}</p>
                  {r.outcome && (
                    <p className="text-[10px] font-mono text-muted-foreground/50 capitalize">→ {r.outcome}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {calendarDate && filtered.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-xs text-muted-foreground/50 italic">No reflections on this day.</p>
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
            {search
              ? t('history.noReflectionsSearch')
              : filter === 'favorites'
                ? t('history.noFavorites')
                : t('history.noReflectionsYet')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
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
                  <ReflectionWallpaper message={r.message} mood={r.mood} context={r.context} haiku={r.haiku} />
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
                        <AlertDialogTitle className="font-mono text-sm">{t('history.deleteReflection')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs">
                          {t('history.deleteReflectionDesc')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-mono text-xs">{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteReflection(r.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
                        >
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{r.message}</p>
              <ReflectionNote reflectionId={r.id} initialNote={r.note} />
              <ReflectionTags reflectionId={r.id} initialTags={r.tags ?? []} />

              {/* Companions section — collapsible */}
              {(() => {
                const companionItems: string[] = [];
                if (r.haiku) companionItems.push('Haiku');
                if (r.learning_title) companionItems.push('Learning');
                if (r.signal_source) companionItems.push('Signal');
                if (r.zoom_out_data) companionItems.push('Zoom Out');
                if (r.history_insight_data) companionItems.push('History');
                if (companionItems.length === 0) return null;

                return (
                  <HistoryCompanions
                    label={`${companionItems.length} ${companionItems.length !== 1 ? t('history.companions_other', { count: companionItems.length }) : t('history.companions', { count: 1 })}`}
                    r={r}
                  />
                );
              })()}

              <ReflectionComparison reflectionId={r.id} />
            </div>
          ))}
          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {loadingMore && (
            <div className="py-4 text-center">
              <p className="text-[10px] font-mono text-muted-foreground animate-pulse">{t('common.loadingMore')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryContent;
