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
      <div className="sticky top-0 z-20 backdrop-blur-md bg-background/70 border-b border-border/10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted/40 text-muted-foreground/50 hover:text-foreground/70 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <NoxHeaderMain title={t('ground.historyTitle', 'Grounding Journal')} />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-8">
        {/* Stats summary */}
        {!loading && totalSessions > 0 && (
          <motion.div
            className="flex justify-center gap-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="text-center space-y-1">
              <p className="text-2xl font-mono text-foreground/70">{totalSessions}</p>
              <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted-foreground/40">
                {t('ground.sessions', 'Sessions')}
              </p>
            </div>
            <div className="w-px bg-border/10" />
            <div className="text-center space-y-1">
              <p className="text-2xl font-mono text-foreground/70">{totalMinutes}</p>
              <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted-foreground/40">
                {t('ground.minutesGrounded', 'Minutes')}
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
            <Anchor className="h-5 w-5 text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground/40 font-mono">
              {t('ground.noHistory', 'No grounding sessions yet')}
            </p>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => navigate('/ground', { replace: true })}
              className="mx-auto font-mono"
            >
              {t('ground.startFirst', 'Start your first session')}
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
                    <div className="bg-muted/20 backdrop-blur-sm border border-border/10 rounded-xl px-5 py-4 space-y-3 hover:border-border/20 transition-colors duration-300">
                      {/* Top row: date + duration */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground/25" />
                          <span className="text-[10px] font-mono text-muted-foreground/40">
                            {date.relative}
                          </span>
                          <span className="text-[9px] text-muted-foreground/20">·</span>
                          <span className="text-[10px] font-mono text-muted-foreground/30">
                            {date.time}
                          </span>
                        </div>
                        {entry.duration_seconds && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground/25" />
                            <span className="text-[10px] font-mono text-muted-foreground/40">
                              {formatDuration(entry.duration_seconds)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Activity + mood */}
                      <div className="flex items-center gap-3">
                        {entry.mood && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <MoodIcon mood={entry.mood} size={16} className="text-muted-foreground/50" />
                            <span className="text-[9px] font-mono tracking-wider uppercase text-muted-foreground/35">
                              {t(`moodCheck.moods.${entry.mood}`, entry.mood)}
                            </span>
                          </div>
                        )}
                        {entry.trigger_text && (
                          <>
                            {entry.mood && <span className="text-muted-foreground/15">·</span>}
                            <span className="text-[10px] font-mono text-muted-foreground/50 truncate">
                              {entry.trigger_text}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Reflection note */}
                      {entry.body && (
                        <p className="text-xs text-foreground/50 leading-relaxed font-mono border-l-2 border-border/15 pl-3">
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
                  onClick={loadMore}
                  className="text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors tracking-[0.2em] uppercase"
                >
                  {t('common.loadMore', 'Load more')}
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
