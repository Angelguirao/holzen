import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Inbox } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { Button } from '@/components/ui/button';

interface PendingReflection {
  id: string;
  message: string;
  context: string | null;
  created_at: string;
}

export function BulkHoldCard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingReflection[]>([]);
  const [resolved, setResolved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('reflections')
      .select('id, message, context, created_at')
      .eq('user_id', user.id)
      .is('outcome', null)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data && data.length >= 2) {
          setPending(data);
        }
      });
  }, [user]);

  const handleHoldAll = async () => {
    if (!user || pending.length === 0) return;
    setLoading(true);
    hapticFeedback('medium');

    const ids = pending.map((r) => r.id);
    // Batch update all pending reflections to 'hold'
    const { error } = await supabase
      .from('reflections')
      .update({ outcome: 'hold' })
      .in('id', ids);

    if (!error) {
      hapticFeedback('success');
      setResolved(true);
      setTimeout(() => setPending([]), 2000);
    }
    setLoading(false);
  };

  const handleDismiss = () => {
    setPending([]);
  };

  if (pending.length < 2) return null;

  return (
    <AnimatePresence mode="wait">
      {resolved ? (
        <motion.div
          key="resolved"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3"
        >
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Check className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xs font-mono text-primary/70">
            {t('bulkHold.allMarkedHold', { count: pending.length, defaultValue: '{{count}} pauses marked as Hold' })}
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="prompt"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-lg border border-border/60 bg-muted/30 px-4 py-4 space-y-3"
        >
          <div className="flex items-start gap-3">
            <Inbox className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-xs font-mono text-foreground/80">
                {t('bulkHold.title', { count: pending.length, defaultValue: '{{count}} pauses while you were away' })}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/50 leading-relaxed">
                {t('bulkHold.subtitle', 'Mark all as Hold with one tap, or review them individually in the Library.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleHoldAll}
              disabled={loading}
              size="sm"
              className="flex-1 font-mono text-xs"
            >
              {loading ? t('common.loading') : t('bulkHold.holdAll', 'Hold all')}
            </Button>
            <button
              onClick={handleDismiss}
              className="text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors px-2"
            >
              {t('common.dismiss', 'Dismiss')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
