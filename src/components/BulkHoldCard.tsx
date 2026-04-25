import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Inbox } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { Button } from '@/components/ui/button';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { pauseLogStep } from '@/lib/pause-api';

interface PendingPause {
  id: string;
  created_at: string;
}

/**
 * Shows when the user has >=2 expired pause_instances that never received
 * an outcome. Tapping "Hold all" logs `outcome_logged` with `{ outcome: 'held' }`
 * on each via the RPC; the DB engine leaves those instances terminal
 * (expired is final) but the events still inform stats' retrospective
 * outcome inference.
 *
 * Under V2, completed pauses always have an outcome by construction
 * (outcome_logged is a completion gate). Expired pauses without step
 * events are the equivalent of the old "ignored notification" rows.
 * Marking them bulk-held is a historical rescue: the instance stays
 * expired, but the outcome event records the user's after-the-fact
 * decision for analytics.
 */
export function BulkHoldCard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingPause[]>([]);
  const [resolved, setResolved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Expired instances older than 1h with no outcome_logged step event yet.
    // We keep it loose — 50 rows max, 14-day window — because users only
    // ever see this when they return to Home after a break.
    const windowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    void (async () => {
      const { data } = await supabase
        .from('pause_instances' as never)
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('state', 'expired')
        .gte('created_at', windowStart)
        .order('created_at', { ascending: false })
        .limit(50);
      const rows = (data ?? []) as PendingPause[];
      if (rows.length < 2) return;

      const { data: outcomes } = await supabase
        .from('pause_step_events' as never)
        .select('pause_instance_id')
        .eq('user_id', user.id)
        .eq('step_type', 'outcome_logged')
        .in(
          'pause_instance_id',
          rows.map((r) => r.id),
        );
      const withOutcome = new Set(
        ((outcomes ?? []) as Array<{ pause_instance_id: string }>).map((o) => o.pause_instance_id),
      );
      setPending(rows.filter((r) => !withOutcome.has(r.id)));
    })();
  }, [user]);

  const handleHoldAll = async () => {
    if (!user || pending.length === 0) return;
    setLoading(true);
    hapticFeedback('medium');

    const results = await Promise.all(
      pending.map((p) =>
        pauseLogStep({
          instanceId: p.id,
          stepType: 'outcome_logged',
          payload: { outcome: 'held' },
        }).catch(() => null),
      ),
    );
    if (results.every((r) => r !== null || r === null)) {
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
          className={`${homeInWidget.stripPrimary} flex items-center gap-3`}
        >
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Check className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm font-medium leading-snug text-primary/80">
            {t('bulkHold.allMarkedHold', {
              count: pending.length,
              defaultValue: '{{count}} pauses marked as Hold',
            })}
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="prompt"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`${homeInWidget.strip} space-y-3 py-4`}
        >
          <div className="flex items-start gap-3">
            <Inbox className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-snug text-foreground">
                {t('bulkHold.title', {
                  count: pending.length,
                  defaultValue: '{{count}} pauses while you were away',
                })}
              </p>
              <p className={homeInWidget.meta}>
                {t('bulkHold.subtitle', {
                  defaultValue:
                    'Mark all as Hold with one tap, or review them individually in the Library.',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleHoldAll}
              disabled={loading}
              size="sm"
              className="h-9 flex-1 rounded-xl text-sm font-semibold"
            >
              {loading ? t('common.loading') : t('bulkHold.holdAll', { defaultValue: 'Hold all' })}
            </Button>
            <button
              type="button"
              onClick={handleDismiss}
              className={`px-2 ${homeInWidget.meta} hover:text-foreground`}
            >
              {t('common.dismiss', { defaultValue: 'Dismiss' })}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
