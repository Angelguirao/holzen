import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { hapticFeedback } from '@/lib/haptics';
import { toast } from 'sonner';
import { Check, RefreshCw } from 'lucide-react';

const PROMPTS = [
  'practice.prompt1',
  'practice.prompt2',
  'practice.prompt3',
  'practice.prompt4',
  'practice.prompt5',
  'practice.prompt6',
];

interface Props {
  onComplete: () => void;
  textColor: string;
  ringColor: string;
}

export function GuidedJournal({ onComplete, textColor, ringColor }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const prompt = useMemo(() => t(PROMPTS[promptIndex]), [promptIndex, t]);

  const shufflePrompt = useCallback(() => {
    setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
    hapticFeedback('light');
  }, []);

  const save = useCallback(async () => {
    if (!user || !body.trim()) return;
    setSaving(true);
    try {
      await supabase.from('practice_entries' as any).insert({
        user_id: user.id,
        type: 'journal',
        body: body.trim(),
        prompt: PROMPTS[promptIndex],
      });
      hapticFeedback('success');
      setDone(true);
      setTimeout(onComplete, 1500);
    } catch {
      toast(t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  }, [user, body, promptIndex, onComplete, t]);

  return (
    <motion.div
      className="flex flex-col items-center gap-6 max-w-sm mx-auto w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="write" className="flex flex-col items-center gap-6 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3">
              <p className="text-xs font-mono text-center leading-relaxed max-w-[260px]" style={{ color: textColor, opacity: 0.7 }}>
                {prompt}
              </p>
              <button onClick={shufflePrompt} className="shrink-0 p-1.5 rounded-full transition-opacity hover:opacity-80" style={{ color: textColor, opacity: 0.3 }}>
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('practice.journalPlaceholder')}
              className="w-full h-40 bg-transparent border rounded-md p-4 text-sm leading-relaxed resize-none focus:outline-none"
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
              {t('practice.journalSaved')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
