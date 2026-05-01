import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { hapticFeedback } from '@/lib/haptics';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { MoodIcon, MOOD_GLYPHS } from '@/components/icons/MoodIcon';

const MOODS = ['fomo', 'excited', 'greedy', 'anxious', 'calm', 'detached', 'uncertain', 'fearful'] as const;
const INTENSITIES = [1, 2, 3, 4, 5] as const;

interface Props {
  onComplete: () => void;
  textColor: string;
  ringColor: string;
  glowColor: string;
}

export function EmotionalCheckIn({ onComplete, textColor, ringColor }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState<'mood' | 'intensity' | 'trigger' | 'done'>('mood');
  const [mood, setMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [trigger, setTrigger] = useState('');
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('practice_entries').insert({
        user_id: user.id,
        type: 'checkin',
        mood,
        intensity,
        trigger_text: trigger || null,
      });
      if (error) throw error;
      hapticFeedback('success');
      setStep('done');
      setTimeout(onComplete, 1500);
    } catch {
      toast(t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  }, [user, mood, intensity, trigger, onComplete, t]);

  return (
    <motion.div
      className="flex flex-col items-center gap-8 max-w-xs mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {step === 'mood' && (
          <motion.div key="mood" className="flex flex-col items-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: textColor }}>
              {t('practice.howAreYou')}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => { setMood(m); hapticFeedback('light'); setStep('intensity'); }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all hover:scale-105"
                  style={{
                    borderColor: mood === m ? ringColor : 'transparent',
                    background: mood === m ? `${ringColor}` : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <MoodIcon mood={m} size={20} style={{ color: textColor, opacity: 0.7 }} />
                  <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: textColor, opacity: 0.7 }}>
                    {t(`moodCheck.moods.${m}`)}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'intensity' && (
          <motion.div key="intensity" className="flex flex-col items-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: textColor }}>
              {t('practice.howIntense')}
            </p>
            <div className="flex gap-3">
              {INTENSITIES.map((i) => (
                <button
                  key={i}
                  onClick={() => { setIntensity(i); hapticFeedback('light'); }}
                  className="w-10 h-10 rounded-full font-mono text-sm transition-all"
                  style={{
                    border: `1px solid ${intensity === i ? ringColor : 'rgba(255,255,255,0.1)'}`,
                    background: intensity === i ? ringColor : 'transparent',
                    color: textColor,
                    opacity: intensity === i ? 1 : 0.5,
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('trigger')}
              className="text-[10px] font-mono tracking-[0.2em] uppercase mt-4"
              style={{ color: textColor, opacity: 0.6 }}
            >
              {t('common.continue')}
            </button>
          </motion.div>
        )}

        {step === 'trigger' && (
          <motion.div key="trigger" className="flex flex-col items-center gap-6 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: textColor }}>
              {t('practice.whatTriggered')}
            </p>
            <textarea
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder={t('practice.triggerPlaceholder')}
              className="w-full h-24 bg-transparent border rounded-md p-3 text-sm font-mono resize-none focus:outline-none"
              style={{ borderColor: ringColor, color: textColor, opacity: 0.8 }}
              autoFocus
            />
            <div className="flex gap-4">
              <button
                onClick={save}
                disabled={saving}
                className="text-[10px] font-mono tracking-[0.2em] uppercase"
                style={{ color: textColor, opacity: 0.8 }}
              >
                {saving ? t('common.loading') : t('common.done')}
              </button>
              <button
                onClick={() => { setTrigger(''); save(); }}
                disabled={saving}
                className="text-[10px] font-mono tracking-[0.2em] uppercase"
                style={{ color: textColor, opacity: 0.3 }}
              >
                {t('common.skip')}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <Check className="h-8 w-8" style={{ color: textColor, opacity: 0.6 }} />
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: textColor, opacity: 0.5 }}>
              {t('practice.checkinSaved')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
