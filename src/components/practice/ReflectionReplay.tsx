import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { hapticFeedback } from '@/lib/haptics';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Check, RefreshCw } from 'lucide-react';

interface PastReflection {
  id: string;
  message: string;
  mood: string | null;
  context: string | null;
  created_at: string;
}

interface Props {
  onComplete: () => void;
  textColor: string;
  ringColor: string;
}

export function ReflectionReplay({ onComplete, textColor, ringColor }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reflection, setReflection] = useState<PastReflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const loadRandom = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get a random reflection older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('reflections')
        .select('id, message, mood, context, created_at')
        .eq('user_id', user.id)
        .lt('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data || data.length === 0) {
        setNoData(true);
        setLoading(false);
        return;
      }

      const random = data[Math.floor(Math.random() * data.length)];
      setReflection(random);
    } catch {
      setNoData(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadRandom(); }, [loadRandom]);

  const save = useCallback(async () => {
    if (!user || !reflection || !body.trim()) return;
    setSaving(true);
    try {
      await supabase.from('practice_entries' as any).insert({
        user_id: user.id,
        type: 'replay',
        body: body.trim(),
        source_reflection_id: reflection.id,
      });
      hapticFeedback('success');
      setDone(true);
      setTimeout(onComplete, 1500);
    } catch {
      toast(t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  }, [user, reflection, body, onComplete, t]);

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
            {/* Past reflection card */}
            {reflection && (
              <div className="w-full rounded-md p-4 space-y-2" style={{ border: `1px solid ${ringColor}`, background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: textColor, opacity: 0.4 }}>
                    {format(new Date(reflection.created_at), 'MMM d, yyyy')}
                  </p>
                  <button onClick={() => { loadRandom(); setBody(''); }} className="p-1" style={{ color: textColor, opacity: 0.3 }}>
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
                {reflection.context && (
                  <p className="text-[10px] font-mono" style={{ color: textColor, opacity: 0.35 }}>
                    {reflection.context}
                  </p>
                )}
                <p className="text-sm leading-relaxed" style={{ color: textColor, opacity: 0.7 }}>
                  {reflection.message}
                </p>
              </div>
            )}

            <p className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: textColor, opacity: 0.5 }}>
              {t('practice.replayPrompt')}
            </p>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('practice.replayPlaceholder')}
              className="w-full h-28 bg-transparent border rounded-md p-3 text-sm leading-relaxed resize-none focus:outline-none"
              style={{ borderColor: ringColor, color: textColor, opacity: 0.8 }}
              autoFocus
            />

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
