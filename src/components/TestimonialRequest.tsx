import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { toast } from 'sonner';

const DISMISS_KEY = 'holzen_testimonial_dismissed';
const SUBMITTED_KEY = 'holzen_testimonial_submitted';

// Show after 10+ completed pauses, not dismissed, not already submitted
function shouldShow(completedPauseCount: number): boolean {
  if (completedPauseCount < 10) return false;
  if (localStorage.getItem(SUBMITTED_KEY)) return false;
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (dismissed) {
    const dismissedAt = new Date(dismissed).getTime();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (dismissedAt > weekAgo) return false;
  }
  return true;
}


interface Props {
  completedPauseCount: number;
}

export function TestimonialRequest({ completedPauseCount }: Props) {
  const { user } = useAuth();
  const { firstName } = useHolzen();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [quote, setQuote] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setVisible(shouldShow(completedPauseCount));
  }, [completedPauseCount]);

  useEffect(() => {
    if (firstName) setDisplayName(firstName);
  }, [firstName]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setVisible(false);
  };

  const submit = async () => {
    if (!user || !quote.trim() || !displayName.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('testimonials').insert({
      user_id: user.id,
      display_name: displayName.trim(),
      quote: quote.trim(),
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error(t('testimonial.failed'));
    } else {
      localStorage.setItem(SUBMITTED_KEY, 'true');
      toast.success(t('testimonial.thanks'));
      setVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm text-foreground font-medium">{t('testimonial.title')}</p>
            </div>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('testimonial.subtitle')}</p>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('testimonial.nameLabel')}
            className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/50"
            maxLength={50}
          />
          <Textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder={t('testimonial.placeholder')}
            className="text-xs min-h-[60px] resize-none"
            maxLength={280}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{quote.length}/280</span>
            <LoadingButton
              size="sm"
              onClick={submit}
              loading={submitting}
              disabled={!quote.trim() || !displayName.trim()}
              className="text-xs font-mono gap-1.5"
            >
              <Send className="h-3 w-3" />
              {t('testimonial.submit')}
            </LoadingButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
