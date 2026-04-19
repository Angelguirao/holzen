import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { useHolzen } from '@/hooks/use-holzen';
import { formatBtcPrice } from '@/lib/btc';
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { X, Star, Search, Pin, Info, TrendingUp, TrendingDown, Clock, History as HistoryIcon, ExternalLink, ArrowRight, ChevronDown, CalendarIcon, Filter, List, LayoutGrid, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { VolatilityTimeline } from '@/components/VolatilityTimeline';
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
import { detectSkills, SKILL_LABELS, SKILL_COLORS, type SkillType } from '@/lib/skill-detection';
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
  grounding_title: string | null;
  grounding_body: string | null;
  note: string | null;
  mood: string | null;
  mood_after?: string | null;
  outcome: string | null;
  tags: string[];
  breathing_completed?: boolean;
  zoom_out_read?: boolean;
  history_read?: boolean;
  signal_read?: boolean;
  grounding_read?: boolean;
  // From view joins (now the only source for signal/zoom/history)
  signal_title?: string | null;
  signal_source?: string | null;
  companion_signal_title?: string | null;
  companion_signal_body?: string | null;
  companion_signal_source?: string | null;
  companion_signal_url?: string | null;
  companion_grounding_title?: string | null;
  companion_grounding_body?: string | null;
  companion_grounding_citation?: string | null;
  companion_grounding_url?: string | null;
  companion_history_data?: any | null;
  companion_zoom_out_data?: any | null;
  zoom_out_data?: any | null;
  history_insight_data?: any | null;
}

const PAGE_SIZE = 30;
const FIELDS = 'id, message, context, created_at, is_favorite, haiku, grounding_title, grounding_body, signal_title, signal_source, signal_read, grounding_read, zoom_out_read, history_read, zoom_out_data, history_insight_data, note, mood, mood_after, outcome, tags, breathing_completed, companion_signal_title, companion_signal_body, companion_signal_source, companion_signal_url, companion_grounding_title, companion_grounding_body, companion_grounding_citation, companion_grounding_url, companion_history_data, companion_zoom_out_data';

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

          {(r.grounding_title || r.companion_grounding_title) && (r.grounding_body || r.companion_grounding_body) && (
            <LearningInput
              title={(r.companion_grounding_title ?? r.grounding_title)!}
              body={(r.companion_grounding_body ?? r.grounding_body)!}
              nudge={r.companion_grounding_citation ? {
                title: (r.companion_grounding_title ?? r.grounding_title)!,
                body: (r.companion_grounding_body ?? r.grounding_body)!,
                citation: r.companion_grounding_citation,
                url: r.companion_grounding_url ?? '',
              } : undefined}
            />
          )}

          {(r.companion_signal_source || r.signal_source) && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Signal</p>
              {(r.companion_signal_title ?? r.signal_title) && <p className="text-xs font-medium leading-snug">{r.companion_signal_title ?? r.signal_title}</p>}
              {r.companion_signal_body && <p className="text-xs text-muted-foreground leading-relaxed">{r.companion_signal_body}</p>}
              {r.companion_signal_url && (
                <a
                  href={r.companion_signal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  {r.companion_signal_source ?? r.signal_source}
                </a>
              )}
            </div>
          )}

          {(r.companion_zoom_out_data || r.zoom_out_data) && (() => {
            const zod = (r.companion_zoom_out_data ?? r.zoom_out_data) as any;
            return (
            <div className="space-y-2">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Zoom out</p>
              {zod.onThisDay?.length > 0 && zod.currentPrice && (
                <div className="space-y-1">
                  {[...zod.onThisDay].reverse().map((entry: any) => {
                    const changePct = ((zod.currentPrice - entry.price) / entry.price) * 100;
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
              {zod.echo && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground/50" />
                    <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                      Echo{zod.echo.created_at ? ` · ${format(new Date(zod.echo.created_at), 'MMM d, yyyy')}` : ''}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-2">
                    "{zod.echo.message}"
                  </p>
                </div>
              )}
            </div>
            );
          })()}

          {(r.companion_history_data || r.history_insight_data) && (() => {
            const hid = (r.companion_history_data ?? r.history_insight_data) as any;
            return (
            <div className="space-y-2">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Historical insight</p>
              <p className="text-xs font-mono font-medium leading-relaxed">{hid.title}</p>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <HistoryIcon className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                  <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Bitcoin · {hid.period}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{hid.btcInsight}</p>
              </div>
              <div className="space-y-1 pl-3 border-l-2 border-border/40">
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
                  <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">{hid.assetClass} parallel</p>
                </div>
                <p className="text-xs text-muted-foreground/80 leading-relaxed italic">{hid.analogy}</p>
              </div>
            </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

const History = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useHolzen();
  const { subscribed } = useSubscription();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tab, setTab] = useState<'recent' | 'library' | 'timeline'>('recent');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [skillFilter, setSkillFilter] = useState<SkillType | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);
  const [calendarFilters, setCalendarFilters] = useState<Set<ActivityType>>(new Set(['reflection', 'letter', 'badge']));
  const [calendarActivities, setCalendarActivities] = useState<CalendarActivity[]>([]);

  useEffect(() => {
    document.title = 'Holzen — History';
    return () => { document.title = 'Holzen — Pause before you act'; };
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadReflections = async () => {
      const { data } = await supabase
        .from('v_reflection_with_companions')
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

    // Load calendar activities (all reflections + letters + badges)
    useEffect(() => {
      if (!user) return;
      const loadActivities = async () => {
        const [{ data: allReflections }, { data: letters }, { data: badges }] = await Promise.all([
          supabase
            .from('reflections')
            .select('id, created_at, mood, mood_after, outcome, breathing_completed')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase.from('future_letters').select('id, written_at, deliver_during').eq('user_id', user.id).order('written_at', { ascending: false }),
          supabase.from('user_badges').select('id, earned_at, badge_id').eq('user_id', user.id).order('earned_at', { ascending: false }),
        ]);

        const activities: CalendarActivity[] = [];

        // Activity calendar shows engaged pauses only.
        (allReflections ?? [])
          .filter((r: any) => r.breathing_completed && r.mood && r.mood_after && r.outcome)
          .forEach((r: any) => {
            activities.push({ date: r.created_at, type: 'reflection', mood: r.mood, id: r.id });
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
      .from('v_reflection_with_companions')
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
    // Optimistic update
    setReflections((prev) => prev.map((r) => (r.id === id ? { ...r, is_favorite: newVal } : r)));
    const [r1, r2] = await Promise.all([
      supabase.from('reflections').update({ is_favorite: newVal }).eq('id', id),
      supabase.from('library_items').update({ is_favorite: newVal }).eq('reflection_id', id).eq('source_type', 'reflection'),
    ]);
    if (r1.error || r2.error) {
      // Roll back optimistic update on failure
      setReflections((prev) => prev.map((r) => (r.id === id ? { ...r, is_favorite: !newVal } : r)));
    }
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

  const moods = ['fomo', 'excited', 'greedy', 'anxious', 'calm', 'detached', 'uncertain', 'fearful'] as const;

  const filtered = useMemo(() => {
    let result = filter === 'favorites' ? reflections.filter((r) => r.is_favorite) : reflections;
    if (tagFilter) {
      result = result.filter((r) => r.tags?.includes(tagFilter));
    }
    if (moodFilter) {
      result = result.filter((r) => r.mood === moodFilter);
    }
    if (skillFilter) {
      result = result.filter((r) => detectSkills(r).includes(skillFilter));
    }
    if (dateFrom) {
      result = result.filter((r) => isAfter(new Date(r.created_at), startOfDay(dateFrom)));
    }
    if (dateTo) {
      result = result.filter((r) => isBefore(new Date(r.created_at), endOfDay(dateTo)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.message.toLowerCase().includes(q) || r.context?.toLowerCase().includes(q) || r.note?.toLowerCase().includes(q) || r.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [reflections, filter, tagFilter, moodFilter, skillFilter, dateFrom, dateTo, search]);

  const filteredRecent = useMemo(() => {
    let result = recentReflections;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.message.toLowerCase().includes(q) || r.context?.toLowerCase().includes(q) || r.note?.toLowerCase().includes(q) || r.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    // If calendar view with a selected date, filter to that day
    if (viewMode === 'calendar' && calendarDate) {
      result = reflections.filter((r) => isSameDay(new Date(r.created_at), calendarDate));
      if (search.trim()) {
        const q = search.toLowerCase();
        result = result.filter(
          (r) => r.message.toLowerCase().includes(q) || r.context?.toLowerCase().includes(q) || r.note?.toLowerCase().includes(q) || r.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
    }
    return result;
  }, [recentReflections, reflections, search, viewMode, calendarDate]);

  const displayedReflections = tab === 'recent' ? filteredRecent : filtered;

  const hasActiveFilters = !!tagFilter || !!moodFilter || !!skillFilter || !!dateFrom || !!dateTo || filter === 'favorites';

  const clearAllFilters = useCallback(() => {
    setFilter('all');
    setTagFilter(null);
    setMoodFilter(null);
    setSkillFilter(null);
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearch('');
  }, []);

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
            {t('history.recent')}
          </button>
          <button
            onClick={() => setTab('library')}
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${
              tab === 'library' ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            {t('history.library')}
          </button>
          <button
            onClick={() => setTab('timeline')}
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${
              tab === 'timeline' ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            {t('history.timeline')}
          </button>
          <div className="flex-1" />
          {tab === 'recent' && (
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
          )}
        </div>
         {tab !== 'timeline' && viewMode !== 'calendar' && (
          <p className="text-xs text-muted-foreground">
            {tab === 'recent'
              ? t('history.reflectionsInLast7Days', { count: filteredRecent.length })
              : t('history.reflectionsOf', { filtered: filtered.length, total: reflections.length, count: reflections.length })}
          </p>
        )}
      </div>

      {/* Search & filters (available on recent + library) */}
      {tab !== 'timeline' && (
        <div className="space-y-3">
          {/* Search bar */}
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

          {/* Filter toggle + active filter badges */}
          {tab === 'library' && (
            <div className="space-y-3">
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

                  {/* Skill filter */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">{t('history.skill', 'Skill')}</p>
                    <div className="flex flex-wrap gap-1">
                      {(['regulation', 'tolerance', 'alignment', 'reappraisal', 'awareness'] as SkillType[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSkillFilter(skillFilter === s ? null : s)}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                            skillFilter === s
                              ? 'bg-primary/10 text-primary'
                              : 'border border-border/60 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {t(SKILL_LABELS[s])}
                        </button>
                      ))}
                    </div>
                  </div>

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
          )}
        </div>
      )}

      {/* Timeline tab */}
      {tab === 'timeline' ? (
        <VolatilityTimeline />
      ) : tab === 'recent' && viewMode === 'calendar' ? (
        <div className="space-y-4">
          <HistoryCalendar
            activities={calendarActivities}
            selectedDate={calendarDate}
            onSelectDate={setCalendarDate}
          />
          {/* Show reflections for selected day */}
          {calendarDate && displayedReflections.length > 0 && (
            <div className="space-y-3">
              {displayedReflections.map((r) => (
                <div
                  key={r.id}
                  className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-mono text-muted-foreground">
                      {format(new Date(r.created_at), 'h:mm a')}
                      {r.mood && <span className="ml-1.5 capitalize text-muted-foreground/60">· {r.mood}</span>}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleFavorite(r.id)}
                        className={`p-1 transition-colors ${r.is_favorite ? 'text-destructive' : 'text-muted-foreground/40 hover:text-destructive'}`}
                      >
                        <Heart className={`h-3 w-3 ${r.is_favorite ? 'fill-current' : ''}`} />
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
          {calendarDate && displayedReflections.length === 0 && (
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
      ) : displayedReflections.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {tab === 'recent'
              ? t('history.noReflectionsRecent')
              : search
                ? t('history.noReflectionsSearch')
                : filter === 'favorites'
                  ? t('history.noFavorites')
                  : t('history.noReflectionsYet')}
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
                    className={`p-1 transition-colors ${r.is_favorite ? 'text-destructive' : 'text-muted-foreground/40 hover:text-destructive'}`}
                    aria-label={r.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`h-3 w-3 ${r.is_favorite ? 'fill-current' : ''}`} />
                  </button>
                  <ShareReflection message={r.message} context={r.context} haiku={r.haiku} />
                  {subscribed && <ReflectionWallpaper message={r.message} mood={r.mood} context={r.context} haiku={r.haiku} />}
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
              {/* Outcome / Incomplete indicator */}
              {r.outcome ? (
                <p className="text-[10px] font-mono text-muted-foreground/50 capitalize">→ {r.outcome}</p>
              ) : (
                <p className="text-[10px] font-mono text-muted-foreground/50 italic">
                  {t('history.incomplete', 'Incomplete — no decision recorded')}
                </p>
              )}
              <p className="text-sm leading-relaxed">{r.message}</p>

              {/* Skill badges */}
              {(() => {
                const skills = detectSkills(r);
                if (skills.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1">
                    {skills.map((s) => (
                      <span key={s} className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${SKILL_COLORS[s]}`}>
                        {t(SKILL_LABELS[s])}
                      </span>
                    ))}
                  </div>
                );
              })()}

              <ReflectionNote reflectionId={r.id} initialNote={r.note} />
              <ReflectionTags reflectionId={r.id} initialTags={r.tags ?? []} />

              {/* Companions section — collapsible */}
              {(() => {
                const companionItems: string[] = [];
                if (r.haiku) companionItems.push('Haiku');
                if (r.grounding_title || r.companion_grounding_title) companionItems.push('Grounding');
                if (r.companion_signal_source || r.signal_source) companionItems.push('Signal');
                if (r.companion_zoom_out_data || r.zoom_out_data) companionItems.push('Zoom Out');
                if (r.companion_history_data || r.history_insight_data) companionItems.push('History');
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

export default History;
