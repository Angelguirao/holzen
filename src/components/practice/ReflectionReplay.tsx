import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { usePastReflection } from '@/hooks/use-past-reflection';
import { hapticFeedback } from '@/lib/haptics';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Check, RefreshCw } from 'lucide-react';

interface Props {
  onComplete: () => void;
  textColor: string;
  ringColor: string;
  /** When set (e.g. from Zoom Out Echo), load this reflection instead of a random one. */
  initialReflectionId?: string | null;
}

export function ReflectionReplay({ onComplete, textColor, ringColor, initialReflectionId }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(initialReflectionId ?? null);
  const [noData, setNoData] = useState(false);
  const [pickingRandom, setPickingRandom] = useState(!initialReflectionId);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Pick a random past reflection when Replay is opened without a specific id,
  // or on refresh. Prefers reflections with existing user words so the thread
  // view has something to anchor the new entry against — if none exist, falls
  // back to any reflection ≥7 days old and the `existsWithoutWords` branch
  // handles rendering honestly.
  const pickRandom = useCallback(async () => {
    if (!user) return;
    setPickingRandom(true);
    setNoData(false);
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('reflections')
        .select('id, note')
        .eq('user_id', user.id)
        .lt('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      if (!data || data.length === 0) {
        setNoData(true);
        setActiveId(null);
        setPickingRandom(false);
        return;
      }
      // Prefer rows whose reflection `note` is non-blank — these guarantee the
      // thread has at least one user-words entry. Fall back to the full pool
      // otherwise (the thread view still renders with an honest empty state).
      const withNote = data.filter((r) => (r.note ?? '').trim().length > 0);
      const pool = withNote.length > 0 ? withNote : data;
      const random = pool[Math.floor(Math.random() * pool.length)];
      setActiveId(random.id);
      setPickingRandom(false);
    } catch {
      setNoData(true);
      setActiveId(null);
      setPickingRandom(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (initialReflectionId) {
      setActiveId(initialReflectionId);
      setPickingRandom(false);
      return;
    }
    void pickRandom();
  }, [user, initialReflectionId, pickRandom]);

  const { past, existsWithoutWords, loading: pastLoading } = usePastReflection(activeId);

  const save = useCallback(async () => {
    if (!user || !past || !body.trim()) return;
    setSaving(true);
    try {
      await supabase.from('practice_entries').insert({
        user_id: user.id,
        type: 'replay',
        body: body.trim(),
        source_reflection_id: past.id,
      });
      hapticFeedback('success');
      setDone(true);
      setTimeout(onComplete, 1500);
    } catch {
      toast(t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  }, [user, past, body, onComplete, t]);

  const loading = pickingRandom || (!past && !noData && !!activeId && pastLoading);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-[10px] font-mono tracking-[0.3em] uppercase animate-pulse" style={{ color: textColor, opacity: 0.4 }}>
          {t('common.loading')}
        </p>
      </div>
    );
  }

  if (noData) {
    return (
      <motion.div className="flex flex-col items-center gap-4 py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-xs font-mono text-center max-w-[240px]" style={{ color: textColor, opacity: 0.5 }}>
          {t('practice.needMoreReflections')}
        </p>
      </motion.div>
    );
  }

  const kindLabel = (kind: 'note' | 'replay') =>
    kind === 'replay' ? t('practice.replayYourReplay') : t('practice.replayYourNote');

  return (
    <motion.div
      className="flex flex-col items-center gap-6 max-w-sm mx-auto w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="replay" className="flex flex-col items-center gap-6 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {past && (
              <div className="w-full min-w-0 rounded-md p-4 space-y-3 overflow-hidden" style={{ border: `1px solid ${ringColor}`, background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: textColor, opacity: 0.4 }}>
                    {format(new Date(past.created_at), 'MMM d, yyyy')}
                  </p>
                  {/* Only show "load another" when we didn't open via a specific reflection id. */}
                  {!initialReflectionId && (
                    <button
                      onClick={() => {
                        setBody('');
                        void pickRandom();
                      }}
                      className="p-1"
                      style={{ color: textColor, opacity: 0.3 }}
                      title={t('practice.replayThreadRefresh')}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {past.context && (
                  <p className="text-[10px] font-mono break-words [overflow-wrap:anywhere]" style={{ color: textColor, opacity: 0.35 }}>
                    {past.context}
                  </p>
                )}

                {/* AI prompt — honestly labeled as Holzen's question, not "your words". */}
                {past.aiPrompt && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: textColor, opacity: 0.4 }}>
                      {t('practice.replayHolzenAsked')}
                    </p>
                    <p className="text-sm leading-relaxed break-words [overflow-wrap:anywhere]" style={{ color: textColor, opacity: 0.65 }}>
                      {past.aiPrompt}
                    </p>
                  </div>
                )}

                {/* Thread: chronological user-words (note → replays). */}
                {past.userWords.length === 0 ? (
                  <p className="text-[11px] font-mono leading-relaxed italic" style={{ color: textColor, opacity: 0.45 }}>
                    {t('practice.replayNoWordsYet')}
                  </p>
                ) : (
                  <div className="space-y-3 border-t pt-3" style={{ borderColor: ringColor }}>
                    {past.userWords.map((w, idx) => (
                      <div key={`${w.created_at}-${idx}`} className="space-y-1">
                        <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: textColor, opacity: 0.4 }}>
                          {kindLabel(w.kind)} · {format(new Date(w.created_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm leading-relaxed break-words [overflow-wrap:anywhere]" style={{ color: textColor, opacity: 0.75 }}>
                          {w.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {initialReflectionId && past?.id === initialReflectionId && past.userWords.length > 0 && (
              <p className="text-[10px] font-mono text-center max-w-[280px] leading-relaxed" style={{ color: textColor, opacity: 0.45 }}>
                {t('practice.replayFromEchoHint')}
              </p>
            )}

            <div className="w-full space-y-2">
              <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-center" style={{ color: textColor, opacity: 0.5 }}>
                {existsWithoutWords ? t('practice.replayNewEntry') : t('practice.replayPrompt')}
              </p>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('practice.replayPlaceholder')}
                className="w-full h-28 bg-transparent border rounded-md p-3 text-sm leading-relaxed resize-none focus:outline-none"
                style={{ borderColor: ringColor, color: textColor, opacity: 0.8 }}
                autoFocus
              />
            </div>

            <button
              onClick={save}
              disabled={saving || !body.trim()}
              className="text-[10px] font-mono tracking-[0.2em] uppercase transition-opacity disabled:opacity-20"
              style={{ color: textColor, opacity: 0.7 }}
            >
              {saving ? t('common.loading') : t('common.done')}
            </button>
          </motion.div>
        ) : (
          <motion.div key="done" className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <Check className="h-8 w-8" style={{ color: textColor, opacity: 0.6 }} />
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: textColor, opacity: 0.5 }}>
              {t('practice.replaySaved')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
