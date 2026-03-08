import { useState } from 'react';
import { Send, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { enqueueAction } from '@/lib/offline-queue';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  { value: 'bug', labelKey: 'feedback.bug', icon: Bug, descKey: 'feedback.bugDesc' },
  { value: 'feature', labelKey: 'feedback.feature', icon: Lightbulb, descKey: 'feedback.featureDesc' },
  { value: 'question', labelKey: 'feedback.question', icon: HelpCircle, descKey: 'feedback.questionDesc' },
] as const;

export function FeedbackForm() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<string>('question');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!message.trim()) return;

    if (!navigator.onLine) {
      enqueueAction('feedback', { category, message: message.trim() });
      toast(t('feedback.savedOffline'), { description: t('feedback.savedOfflineDesc') });
      setMessage('');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.functions.invoke('send-feedback', {
      body: { category, message: message.trim() },
    });
    setSubmitting(false);
    if (error) {
      toast.error(t('feedback.failedToSend'), { description: t('feedback.tryAgainLater') });
    } else {
      toast.success(t('feedback.sent'), { description: t('feedback.sentDesc') });
      setMessage('');
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
        {t('feedback.getInTouch')}
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t('feedback.description')}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const selected = category === c.value;
          return (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                selected
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5 mb-1" />
              <p className="text-xs font-mono font-medium">{t(c.labelKey)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t(c.descKey)}</p>
            </button>
          );
        })}
      </div>

      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('feedback.placeholder')}
        className="text-xs min-h-[80px] resize-none"
        maxLength={1000}
      />

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{message.length}/1000</span>
        <Button
          size="sm"
          onClick={submit}
          disabled={submitting || !message.trim()}
          className="text-xs font-mono gap-1.5"
        >
          <Send className="h-3 w-3" />
          {submitting ? t('feedback.sending') : t('feedback.send')}
        </Button>
      </div>
    </div>
  );
}
