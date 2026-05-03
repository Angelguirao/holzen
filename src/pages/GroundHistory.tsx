import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Clock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { Button } from '@/components/ui/button';
import { TOOLS } from '@/lib/app-routes';

interface GroundingEntry {
  id: string;
  created_at: string;
  mood: string | null;
  duration_seconds: number | null;
  body: string | null;
  trigger_text: string | null;
}

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const PAGE_SIZE = 20;

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

function formatDate(iso: string, locale: string): { day: string; time: string; relative: string } {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let relative: string;
  if (diffDays === 0) relative = 'Today';
  else if (diffDays === 1) relative = 'Yesterday';
  else if (diffDays < 7) relative = `${diffDays}d ago`;
  else relative = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

  return {
    day: d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
    relative,
  };
}

export default function GroundHistory() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<GroundingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [listFetchFailed, setListFetchFailed] = useState(false);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  const fetchEntries = useCallback(
    async (offset = 0) => {
      if (!user) {
        setEntries([]);
        setLoading(false);
        setHasMore(false);
        setListFetchFailed(false);
        return;
      }

      if (offset === 0) {
        setLoading(true);
        setListFetchFailed(false);
      }

      const { data, error } = await supabase
        .from('practice_entries')
        .select('id, created_at, mood, duration_seconds, body, trigger_text')
        .eq('user_id', user.id)
        .eq('type', 'grounding')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        if (offset === 0) {
          setEntries([]);
          setListFetchFailed(true);
          setHasMore(false);
        } else {
          toast.error(t('common.tryAgain', { defaultValue: 'Try again' }));
          setHasMore(false);
        }
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as GroundingEntry[];
      if (offset === 0) {
        setEntries(rows);
      } else {
        setEntries((prev) => [...prev, ...rows]);
      }
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
    },
    [user, t],
  );

  // Fetch stats
  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data, count, error } = await supabase
        .from('practice_entries')
        .select('duration_seconds', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('type', 'grounding');

      if (error || !data) {
        setTotalSessions(0);
        setTotalMinutes(0);
        return;
      }
      setTotalSessions(count ?? data.length);
      const mins = data.reduce((sum, e) => sum + ((e.duration_seconds as number) || 0), 0) / 60;
      setTotalMinutes(Math.round(mins));
    })();
  }, [user]);

  useEffect(() => {
    fetchEntries(0);
  }, [fetchEntries]);

  const loadMore = () => fetchEntries(entries.length);

  return (
    <motion.div
      className="flex h-full min-h-0 flex-col overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease }}
      style={{ background: 'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)' }}
    >
      <div className="mx-auto w-full max-w-md space-y-6 px-5 pb-10 pt-4 sm:px-8">
        <div className="space-y-1 border-b border-border/20 pb-4">
          <p className="font-editorial text-lg text-foreground">{t('ground.historyTitle', { defaultValue: 'Grounding Journal' })}</p>
          <p className="text-sm text-muted-foreground">{t('ground.historySubtitle', { defaultValue: 'Your grounding sessions and notes' })}</p>
        </div>
        {/* Stats summary */}
        {!loading && totalSessions > 0 && (
          <motion.div
            className="flex justify-center gap-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="space-y-1 text-center">
              <p className="font-editorial text-3xl text-foreground">{totalSessions}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('ground.sessions', { defaultValue: 'Sessions' })}
              </p>
            </div>
            <div className="w-px bg-border/40" />
            <div className="space-y-1 text-center">
              <p className="font-editorial text-3xl text-foreground">{totalMinutes}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('ground.minutesGrounded', { defaultValue: 'Minutes' })}
              </p>
            </div>
          </motion.div>
        )}

        {/* List fetch error (not “no sessions”) */}
        {!loading && listFetchFailed && entries.length === 0 && (
          <motion.div
            className="text-center space-y-4 py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <p className="text-sm text-muted-foreground px-2">{t('ground.historyLoadFailed')}</p>
            <Button variant="secondary" size="sm" className="mx-auto font-mono" onClick={() => void fetchEntries(0)}>
              {t('common.tryAgain', { defaultValue: 'Try again' })}
            </Button>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !listFetchFailed && entries.length === 0 && (
          <motion.div
            className="text-center space-y-4 py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Anchor className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="text-center text-base text-muted-foreground">
              {t('ground.noHistory', { defaultValue: 'No grounding sessions yet' })}
            </p>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => navigate(TOOLS.ground, { replace: true })}
              className="mx-auto font-mono"
            >
              {t('ground.startFirst', { defaultValue: 'Start your first session' })}
            </Button>
          </motion.div>
        )}

        {/* Timeline */}
        {entries.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {entries.map((entry, i) => {
                const date = formatDate(entry.created_at, i18n.language);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.4, ease }}
                    className="group relative"
                  >
                    <div className="space-y-3 rounded-xl border border-border/40 bg-card/40 px-5 py-4 shadow-sm backdrop-blur-sm transition-colors duration-300 hover:border-border">
                      {/* Top row: date + duration */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">
                            {date.relative}
                          </span>
                          <span className="text-muted-foreground/60" aria-hidden>
                            ·
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {date.time}
                          </span>
                        </div>
                        {entry.duration_seconds ? (
                          <div className="flex shrink-0 items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium tabular-nums text-muted-foreground">
                              {formatDuration(entry.duration_seconds)}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Activity + mood */}
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        {entry.mood && (
                          <div className="flex shrink-0 items-center gap-2">
                            <MoodIcon mood={entry.mood} size={18} className="text-muted-foreground" />
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {t(`moodCheck.moods.${entry.mood}`, { defaultValue: entry.mood })}
                            </span>
                          </div>
                        )}
                        {entry.trigger_text && (
                          <>
                            {entry.mood ? <span className="text-muted-foreground/50" aria-hidden>·</span> : null}
                            <span className="min-w-0 truncate text-sm font-medium text-foreground">
                              {entry.trigger_text}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Reflection note */}
                      {entry.body && (
                        <p className="border-l-2 border-primary/30 pl-3 font-editorial text-sm leading-relaxed text-foreground/95">
                          {entry.body}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Load more */}
            {hasMore && (
              <motion.div className="text-center pt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button
                  type="button"
                  onClick={loadMore}
                  className="text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline"
                >
                  {t('common.loadMore', { defaultValue: 'Load more' })}
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted/15 border border-border/5 rounded-xl px-5 py-4 space-y-3 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-muted-foreground/5 rounded" />
                  <div className="h-3 w-12 bg-muted-foreground/5 rounded" />
                </div>
                <div className="h-3 w-32 bg-muted-foreground/5 rounded" />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
