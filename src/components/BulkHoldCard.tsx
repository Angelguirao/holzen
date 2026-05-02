import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Folder, Inbox, List, Sparkles, X } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface PendingPause {
  id: string;
  created_at: string;
  context_snapshot: Record<string, unknown> | null;
}

type SheetMode = 'prompt' | 'review' | 'success';
type OutcomeChoice = 'held' | 'bought' | 'sold';

function localDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDaySectionLabel(iso: string, language: string, t: TFunction): string {
  const d = new Date(iso);
  const today = new Date();
  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  ) {
    return t('bulkHold.sectionToday', { defaultValue: 'Today' });
  }
  return d.toLocaleDateString(language, { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function groupByLocalDay(items: PendingPause[], language: string, t: TFunction): { label: string; items: PendingPause[] }[] {
  const map = new Map<string, PendingPause[]>();
  for (const p of items) {
    const key = localDayKey(p.created_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  const keys = [...map.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return keys.map((key) => {
    const list = map.get(key)!;
    const first = list[0];
    return { label: formatDaySectionLabel(first.created_at, language, t), items: list };
  });
}

function parseChange24hPct(snapshot: Record<string, unknown> | null | undefined): number | null {
  if (!snapshot) return null;
  const v = snapshot.change_24h_pct;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function contextQuote(snapshot: Record<string, unknown> | null | undefined, max = 80): string | null {
  const text = snapshot && typeof snapshot.context_text === 'string' ? snapshot.context_text.trim() : '';
  if (!text) return null;
  const ellip = text.length > max ? `${text.slice(0, max - 1)}…` : text;
  return `“${ellip}”`;
}

function formatLocalTime(iso: string, language: string): string {
  return new Date(iso).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Shows when the user has >=2 expired pause_instances that never received
 * an outcome. Tapping "Hold all" logs `outcome_logged` with `{ outcome: 'held' }`
 * on each via the RPC; the DB engine leaves those instances terminal
 * (expired is final) but the events still inform stats' retrospective
 * outcome inference.
 *
 * Requires DB support: `pause_log_step` must accept `outcome_logged` on
 * `expired` rows (see migration `20260505120000_pause_log_step_expired_outcome_rescue.sql`).
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
  const [draftOutcomes, setDraftOutcomes] = useState<Record<string, OutcomeChoice>>({});
  const [applyError, setApplyError] = useState<string | null>(null);
  const [refetchNonce, setRefetchNonce] = useState(0);

  const pendingRef = useRef(pending);
  const draftRef = useRef(draftOutcomes);
  const sheetModeRef = useRef(sheetMode);
  const loadingRef = useRef(loading);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => {
    draftRef.current = draftOutcomes;
  }, [draftOutcomes]);
  useEffect(() => {
    sheetModeRef.current = sheetMode;
  }, [sheetMode]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const groupedReview = useMemo(
    () => groupByLocalDay(pending, i18n.language, t),
    [pending, i18n.language, t],
  );

  const hasAnyDraft = Object.keys(draftOutcomes).length > 0;

  const loadPending = useCallback(async () => {
    if (!user) return;
    if (sheetModeRef.current === 'success') {
      return;
    }
    const windowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('pause_instances' as never)
      .select('id, created_at, context_snapshot')
      .eq('user_id', user.id)
      .eq('state', 'expired')
      .gte('created_at', windowStart)
      .order('created_at', { ascending: false })
      .limit(50);
    const rows = (data ?? []) as PendingPause[];
    if (rows.length < 2) {
      setPending([]);
      return;
    }

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
    setPending(
      rows
        .filter((r) => !withOutcome.has(r.id))
        .map((r) => ({
          ...r,
          context_snapshot: (r as { context_snapshot?: Record<string, unknown> | null }).context_snapshot ?? null,
        })),
    );
  }, [user]);

  useEffect(() => {
    void loadPending();
  }, [user, refetchNonce, loadPending]);

  const resetSheetUi = useCallback(() => {
    setSheetMode('prompt');
    setHeldCount(0);
    setDraftOutcomes({});
    setApplyError(null);
  }, []);

  /**
   * Logs outcome_logged per row. On full success clears pending and shows the success step in-sheet.
   * On partial failure keeps remaining rows and surfaces applyError.
   */
  const applyOutcomesAndFinish = async (resolver: (p: PendingPause) => OutcomeChoice) => {
    const rows = [...pendingRef.current];
    if (!user || rows.length === 0) return;
    setLoading(true);
    setApplyError(null);
    hapticFeedback('medium');

    const settled = await Promise.allSettled(
      rows.map((p) =>
        pauseLogStep({
          instanceId: p.id,
          stepType: 'outcome_logged',
          payload: { outcome: resolver(p) },
        }),
      ),
    );

    const failedRows: PendingPause[] = [];
    settled.forEach((r, i) => {
      if (r.status === 'rejected') {
        failedRows.push(rows[i]);
        return;
      }
      if (r.value === null || r.value === undefined) {
        failedRows.push(rows[i]);
      }
    });

    if (failedRows.length === rows.length) {
      hapticFeedback('error');
      setApplyError(t('bulkHold.applyFailed'));
      setRefetchNonce((n) => n + 1);
      setLoading(false);
      return;
    }

    if (failedRows.length > 0) {
      hapticFeedback('error');
      setPending(failedRows);
      setDraftOutcomes((prev) => {
        const next: Record<string, OutcomeChoice> = {};
        for (const p of failedRows) {
          if (prev[p.id]) next[p.id] = prev[p.id];
        }
        return next;
      });
      setApplyError(t('bulkHold.applyPartialFailed', { count: failedRows.length }));
      setLoading(false);
      return;
    }

    hapticFeedback('success');
    setHeldCount(rows.length);
    setPending([]);
    setDraftOutcomes({});
    setApplyError(null);
    setSheetMode('success');
    setLoading(false);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (open) {
      setSheetOpen(true);
      return;
    }

    if (loadingRef.current) {
      return;
    }

    const mode = sheetModeRef.current;
    const drafts = draftRef.current;
    const pend = pendingRef.current;
    const draftKeys = Object.keys(drafts);

    if (mode === 'review' && pend.length > 0 && draftKeys.length > 0) {
      void (async () => {
        setApplyError(null);
        await applyOutcomesAndFinish((p) => drafts[p.id] ?? 'held');
      })();
      return;
    }

    setSheetOpen(false);
    resetSheetUi();
  };

  const handleHoldAll = () => applyOutcomesAndFinish(() => 'held');

  const handleReviewHeldAll = () => {
    setDraftOutcomes({});
    return applyOutcomesAndFinish(() => 'held');
  };

  const handleReviewHeldRest = () => applyOutcomesAndFinish((p) => draftRef.current[p.id] ?? 'held');

  const handleDismissTeaser = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    setPending([]);
    setSheetOpen(false);
    resetSheetUi();
  };

  const goArchivePauses = () => {
    navigate('/library?seg=pauses');
    setSheetOpen(false);
    resetSheetUi();
  };

  const goEchoes = () => {
    navigate('/library?seg=echoes');
    setSheetOpen(false);
    resetSheetUi();
    setHeldCount(0);
  };

  const doneAfterSuccess = () => {
    setSheetOpen(false);
    resetSheetUi();
    setHeldCount(0);
  };

  const enterReview = () => {
    hapticFeedback('light');
    setApplyError(null);
    setDraftOutcomes({});
    setSheetMode('review');
  };

  const exitReviewToPrompt = () => {
    hapticFeedback('light');
    setSheetMode('prompt');
    setDraftOutcomes({});
    setApplyError(null);
  };

  const handleDoneInReview = () => {
    if (hasAnyDraft) {
      return applyOutcomesAndFinish((p) => draftRef.current[p.id] ?? 'held');
    }
    exitReviewToPrompt();
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
                  defaultValue: 'Tap to hold all, review dates, or open your Archive.',
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
            {sheetMode === 'review' ? (
              <div className="space-y-2 pr-10 text-center">
                <SheetTitle className="text-base font-semibold sm:text-lg">{t('bulkHold.reviewScreenTitle')}</SheetTitle>
                <p className="whitespace-pre-line text-balance text-sm text-muted-foreground">{t('bulkHold.reviewLead')}</p>
                <p className="sr-only">{t('bulkHold.reviewSub')}</p>
              </div>
            ) : (
              <SheetHeader className="space-y-2 px-0 pr-10 text-left sm:text-left">
                <p className={homeInWidget.kicker}>{t('bulkHold.kicker', { defaultValue: 'Waiting for you' })}</p>
                <SheetTitle className="text-left text-base font-semibold leading-snug sm:text-lg">
                  {sheetMode === 'success'
                    ? t('bulkHold.successHeadline', { defaultValue: 'Held through your stack' })
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
                    : t('bulkHold.subtitle', {
                        defaultValue:
                          'Mark all as Hold with one tap, or review them individually. Your Archive lists each pause.',
                      })}
                </SheetDescription>
              </SheetHeader>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
            {applyError ? (
              <p className="mb-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {applyError}
              </p>
            ) : null}
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
                  className="space-y-6 pt-2"
                >
                  {groupedReview.map((section) => (
                    <div key={section.label} className="space-y-3">
                      <p className="text-base font-medium text-foreground">{section.label}</p>
                      <div className="flex flex-col gap-4">
                        {section.items.map((p) => {
                          const snap = p.context_snapshot;
                          const pct = parseChange24hPct(snap);
                          const quote = contextQuote(snap);
                          const timeLine = formatLocalTime(p.created_at, i18n.language);
                          return (
                            <Collapsible key={p.id} defaultOpen className="group rounded-lg border-2 border-border/60 bg-muted/25">
                              <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
                                <div className="min-w-0 text-base font-medium tabular-nums text-muted-foreground">
                                  <span className="text-foreground">{timeLine}</span>
                                  {pct != null ? (
                                    <>
                                      <span className="mx-1.5 text-muted-foreground/50">·</span>
                                      <span>BTC </span>
                                      <span className={cn(pct >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                                        {pct >= 0 ? '+' : ''}
                                        {pct.toFixed(1)}%
                                      </span>
                                    </>
                                  ) : null}
                                </div>
                                <ChevronDown
                                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
                                  aria-hidden
                                />
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="space-y-3 border-t border-border/40 px-4 pb-4 pt-2">
                                  {quote ? (
                                    <p className="text-sm font-medium italic leading-snug text-foreground">{quote}</p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      {t('bulkHold.reviewNoContext', { defaultValue: 'No reflection line was saved for this pause.' })}
                                    </p>
                                  )}
                                  <RadioGroup
                                    className="flex flex-row flex-wrap gap-x-4 gap-y-2"
                                    value={draftOutcomes[p.id]}
                                    onValueChange={(v) => {
                                      setDraftOutcomes((prev) => ({
                                        ...prev,
                                        [p.id]: v as OutcomeChoice,
                                      }));
                                    }}
                                    aria-label={t('bulkHold.outcomeGroupAria')}
                                  >
                                    <label
                                      htmlFor={`${p.id}-held`}
                                      className="flex cursor-pointer items-center gap-2 rounded-md py-1 pr-2 text-sm font-medium text-foreground"
                                    >
                                      <RadioGroupItem value="held" id={`${p.id}-held`} className="border-muted-foreground/50" />
                                      {t('bulkHold.outcomeHeld', { defaultValue: 'I held' })}
                                    </label>
                                    <label
                                      htmlFor={`${p.id}-bought`}
                                      className="flex cursor-pointer items-center gap-2 rounded-md py-1 pr-2 text-sm font-medium text-foreground"
                                    >
                                      <RadioGroupItem value="bought" id={`${p.id}-bought`} className="border-muted-foreground/50" />
                                      {t('bulkHold.outcomeBought', { defaultValue: 'I bought' })}
                                    </label>
                                    <label
                                      htmlFor={`${p.id}-sold`}
                                      className="flex cursor-pointer items-center gap-2 rounded-md py-1 pr-2 text-sm font-medium text-foreground"
                                    >
                                      <RadioGroupItem value="sold" id={`${p.id}-sold`} className="border-muted-foreground/50" />
                                      {t('bulkHold.outcomeSold', { defaultValue: 'I sold' })}
                                    </label>
                                  </RadioGroup>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={goArchivePauses}
                    className="text-xs font-medium text-primary underline underline-offset-4"
                  >
                    {t('bulkHold.openArchiveFullDetail', { defaultValue: 'Open Archive for full detail' })}
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div
            className="shrink-0 border-t border-border/50 bg-background px-6 pt-4"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
          >
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
                  onClick={enterReview}
                >
                  <List className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  {t('bulkHold.review', { defaultValue: 'Review' })}
                </Button>
              </div>
            ) : sheetMode === 'review' ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  disabled={loading || pending.length === 0}
                  className="h-11 rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90"
                  onClick={hasAnyDraft ? handleReviewHeldRest : handleReviewHeldAll}
                >
                  <Folder className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  {loading
                    ? t('common.loading')
                    : hasAnyDraft
                      ? t('bulkHold.heldRest')
                      : t('bulkHold.heldAllPill')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  className="h-11 rounded-full border-foreground/80 bg-primary/[0.06] font-semibold text-primary hover:bg-primary/10"
                  onClick={handleDoneInReview}
                >
                  {t('bulkHold.done', { defaultValue: 'Done' })}
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
