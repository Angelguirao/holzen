import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, Inbox, List, Sparkles, X } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { Button } from '@/components/ui/button';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { pauseLogStep } from '@/lib/pause-api';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface PendingPause {
  id: string;
  created_at: string;
}

type SheetMode = 'prompt' | 'review' | 'success';

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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingPause[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>('prompt');
  const [heldCount, setHeldCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const formatPauseDate = useCallback(
    (iso: string) =>
      new Date(iso).toLocaleString(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [i18n.language],
  );

  useEffect(() => {
    if (!user) return;
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

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSheetMode('prompt');
      setHeldCount(0);
    }
  };

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
    const ok = results.every((r) => r !== null);
    if (ok) {
      hapticFeedback('success');
      setHeldCount(pending.length);
      setPending([]);
      setSheetMode('success');
    }
    setLoading(false);
  };

  const handleDismissTeaser = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    setPending([]);
    setSheetOpen(false);
    setSheetMode('prompt');
    setHeldCount(0);
  };

  const goLibraryPauses = () => {
    navigate('/library?seg=pauses');
    setSheetOpen(false);
    setSheetMode('prompt');
  };

  const goEchoes = () => {
    navigate('/library?seg=echoes');
    setSheetOpen(false);
    setSheetMode('prompt');
    setHeldCount(0);
  };

  const doneAfterSuccess = () => {
    setSheetOpen(false);
    setSheetMode('prompt');
    setHeldCount(0);
  };

  if (dismissed || (pending.length < 2 && !sheetOpen)) return null;

  const showTeaser = pending.length >= 2;

  return (
    <>
      <AnimatePresence mode="wait">
        {showTeaser ? (
          <motion.div
            key="teaser"
            role="button"
            tabIndex={0}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={() => {
              hapticFeedback('light');
              setSheetOpen(true);
              setSheetMode('prompt');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                hapticFeedback('light');
                setSheetOpen(true);
                setSheetMode('prompt');
              }
            }}
            className={cn(
              homeInWidget.strip,
              'w-full cursor-pointer space-y-3 py-4 text-left transition-colors hover:bg-muted/40',
              'relative rounded-2xl border border-border/50',
            )}
          >
            <button
              type="button"
              onClick={handleDismissTeaser}
              className={cn(homeInWidget.iconBtn, 'absolute right-2 top-2')}
              aria-label={t('common.dismiss', { defaultValue: 'Dismiss' })}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pr-10">
              <p className={homeInWidget.kicker}>{t('bulkHold.kicker', { defaultValue: 'Waiting for you' })}</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
                {t('bulkHold.title', {
                  count: pending.length,
                  defaultValue: '{{count}} pauses while you were away',
                })}
              </p>
              <p className={cn(homeInWidget.meta, 'mt-1')}>
                {t('bulkHold.teaserHint', {
                  defaultValue: 'Tap to hold all, review dates, or open the Library.',
                })}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-primary">
              <span>{t('bulkHold.openSheet', { defaultValue: 'Manage' })}</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side="bottom"
          className={cn(
            'flex max-h-[88vh] flex-col rounded-t-2xl border-t p-0',
            'data-[state=open]:duration-300',
          )}
        >
          <div className="shrink-0 px-6 pb-2 pt-6">
            <SheetHeader className="space-y-2 px-0 pr-10 text-left sm:text-left">
              <p className={homeInWidget.kicker}>{t('bulkHold.kicker', { defaultValue: 'Waiting for you' })}</p>
              <SheetTitle className="text-left text-base font-semibold leading-snug sm:text-lg">
                {sheetMode === 'success'
                  ? t('bulkHold.successHeadline', { defaultValue: 'Held through your stack' })
                  : sheetMode === 'review'
                    ? t('bulkHold.reviewTitle', { defaultValue: 'Pauses to review' })
                    : t('bulkHold.title', {
                        count: pending.length,
                        defaultValue: '{{count}} pauses while you were away',
                      })}
              </SheetTitle>
              <SheetDescription className="text-left text-balance">
                {sheetMode === 'success'
                  ? t('bulkHold.successSub', {
                      defaultValue: 'Your outcomes are logged. Echoes capture what surfaced during each pause.',
                    })
                  : sheetMode === 'review'
                    ? t('bulkHold.reviewSub', {
                        defaultValue: 'These expired without an outcome. Open the Library for full detail on each pause.',
                      })
                    : t('bulkHold.subtitle', {
                        defaultValue:
                          'Mark all as Hold with one tap, or review them individually. The Library lists each pause.',
                      })}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
            <AnimatePresence mode="wait">
              {sheetMode === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-5 pt-2"
                >
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-7 w-7 text-primary" aria-hidden />
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {t('bulkHold.successChosen', { defaultValue: 'You chose deliberately' })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('bulkHold.successHeldLine', {
                        count: heldCount,
                        defaultValue: 'Held through {{count}} pauses',
                      })}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      {t('bulkHold.successConviction', {
                        count: heldCount,
                        defaultValue: '+{{count}} conviction',
                      })}
                    </p>
                  </div>
                  <div className={cn(homeInWidget.inset, 'space-y-3')}>
                    <div className="flex items-start gap-2">
                      <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          {t('bulkHold.echoesCardTitle', { defaultValue: 'Echoes' })}
                        </p>
                        <p className={homeInWidget.metaFaint}>
                          {t('bulkHold.echoesCardBody', {
                            defaultValue: 'Revisit reflections and artifacts from these pauses in Echoes.',
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full justify-between rounded-xl border-primary/25 font-medium text-foreground"
                      onClick={() => {
                        hapticFeedback('light');
                        goEchoes();
                      }}
                    >
                      {t('bulkHold.viewEchoes', { defaultValue: 'View Echoes' })}
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Button>
                  </div>
                </motion.div>
              ) : sheetMode === 'review' ? (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-3 pt-2"
                >
                  <ul className="max-h-[40vh] space-y-2 overflow-y-auto rounded-xl border border-border/40 bg-muted/20 p-3">
                    {pending.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground"
                      >
                        <List className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                        <span className="tabular-nums">{formatPauseDate(p.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="shrink-0 border-t border-border/50 bg-background px-6 pb-8 pt-4">
            {sheetMode === 'prompt' ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  disabled={loading || pending.length === 0}
                  className="h-11 rounded-xl font-semibold"
                  onClick={handleHoldAll}
                >
                  <Folder className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  {loading ? t('common.loading') : t('bulkHold.holdAll', { defaultValue: 'Hold all' })}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending.length === 0}
                  className="h-11 rounded-xl border-primary/35 font-semibold text-primary hover:bg-primary/5"
                  onClick={() => {
                    hapticFeedback('light');
                    setSheetMode('review');
                  }}
                >
                  <List className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  {t('bulkHold.review', { defaultValue: 'Review' })}
                </Button>
              </div>
            ) : sheetMode === 'review' ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-xl"
                  onClick={() => setSheetMode('prompt')}
                >
                  {t('bulkHold.back', { defaultValue: 'Back' })}
                </Button>
                <Button type="button" className="h-11 rounded-xl sm:min-w-[160px]" onClick={goLibraryPauses}>
                  {t('bulkHold.openLibrary', { defaultValue: 'Open Library' })}
                </Button>
              </div>
            ) : (
              <Button type="button" className="h-11 w-full rounded-xl font-semibold" onClick={doneAfterSuccess}>
                {t('bulkHold.done', { defaultValue: 'Done' })}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
