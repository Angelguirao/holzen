import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Anchor, Clock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { NoxHeaderMain } from '@/components/ui/nox-header';
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
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  const fetchEntries = useCallback(async (offset = 0) => {
    if (!user) return;
    const { data } = await supabase
      .from('practice_entries')
      .select('id, created_at, mood, duration_seconds, body, trigger_text')
      .eq('user_id', user.id)
      .eq('type', 'grounding')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (data) {
      if (offset === 0) {
        setEntries(data as GroundingEntry[]);
      } else {
        setEntries(prev => [...prev, ...(data as GroundingEntry[])]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [user]);

  // Fetch stats
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, count } = await supabase
        .from('practice_entries')
        .select('duration_seconds', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('type', 'grounding');

      if (data) {
        setTotalSessions(count ?? data.length);
        const mins = data.reduce((sum, e) => sum + ((e.duration_seconds as number) || 0), 0) / 60;
        setTotalMinutes(Math.round(mins));
      }
    })();
  }, [user]);

  useEffect(() => {
    fetchEntries(0);
  }, [fetchEntries]);

  const loadMore = () => fetchEntries(entries.length);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease }}
      style={{ background: 'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border/30 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="-ml-2 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <NoxHeaderMain
              className="border-0 pb-0"
              title={t('ground.historyTitle', { defaultValue: 'Grounding Journal' })}
              subtitle={t('ground.historySubtitle', { defaultValue: 'Your grounding sessions and notes' })}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-8 px-5 py-8 sm:px-8">
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

        {/* Empty state */}
        {!loading && entries.length === 0 && (
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
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
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
