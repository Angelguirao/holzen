import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/public';
import { useBulkHoldPending } from '@/screens/home/hooks/use-bulk-hold-pending';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, List, X } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { applyBulkHoldOutcomes } from '@/features/pause/public-rpc';
import {
  groupBulkHoldByLocalDay,
  invalidatePauseStatsDataForUser,
  type BulkHoldOutcomeChoice,
  type BulkHoldPendingPause,
} from '@/features/pause/public';
import { Button } from '@/components/ui/button';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { BulkHoldReviewBody } from '@/screens/home/components/bulk-hold/BulkHoldReviewBody';
import { BulkHoldSuccessBody } from '@/screens/home/components/bulk-hold/BulkHoldSuccessBody';
import { cn } from '@/lib/utils';
import { useLatestRef } from '@/hooks/use-latest-ref';

type SheetMode = 'prompt' | 'review' | 'success';

/**
 * Home surface for ≥2 expired pauses without `outcome_logged`. See `docs/systems/pause-system.md`
 * and migration `20260505120000_pause_log_step_expired_outcome_rescue.sql`.
 */
export function BulkHoldCard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [dismissed, setDismissed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>('prompt');
  const [heldCount, setHeldCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draftOutcomes, setDraftOutcomes] = useState<Record<string, BulkHoldOutcomeChoice>>({});
  const [applyError, setApplyError] = useState<string | null>(null);
  const [refetchNonce, setRefetchNonce] = useState(0);

  const fetchEnabled = Boolean(user) && !dismissed && sheetMode !== 'success';
  const { pending, setPending } = useBulkHoldPending({
    userId: user?.id,
    fetchEnabled,
    refetchNonce,
  });

  const sheetModeRef = useLatestRef(sheetMode);
  const loadingRef = useLatestRef(loading);
  const pendingRef = useLatestRef(pending);
  const draftRef = useLatestRef(draftOutcomes);

  const groupedReview = useMemo(
    () => groupBulkHoldByLocalDay(pending, i18n.language, t),
    [pending, i18n.language, t],
  );

  const hasAnyDraft = Object.keys(draftOutcomes).length > 0;

  const resetSheetUi = useCallback(() => {
    setSheetMode('prompt');
    setHeldCount(0);
    setDraftOutcomes({});
    setApplyError(null);
  }, []);

  const applyOutcomesAndFinish = useCallback(
    async (resolver: (p: BulkHoldPendingPause) => BulkHoldOutcomeChoice) => {
      const rows = [...pendingRef.current];
      if (!user || rows.length === 0) return;

      setLoading(true);
      setApplyError(null);
      hapticFeedback('medium');

      const result = await applyBulkHoldOutcomes(rows, resolver);

      if (result.status === 'failed') {
        hapticFeedback('warning');
        setApplyError(t('bulkHold.applyFailed'));
        setRefetchNonce((n) => n + 1);
        setLoading(false);
        return;
      }

      if (result.status === 'partial') {
        hapticFeedback('warning');
        setPending(result.failedRows);
        setDraftOutcomes((prev) => {
          const next: Record<string, BulkHoldOutcomeChoice> = {};
          for (const p of result.failedRows) {
            if (prev[p.id]) next[p.id] = prev[p.id];
          }
          return next;
        });
        setApplyError(t('bulkHold.applyPartialFailed', { count: result.failedRows.length }));
        setLoading(false);
        invalidatePauseStatsDataForUser(user.id);
        return;
      }

      hapticFeedback('success');
      setHeldCount(result.count);
      setPending([]);
      setDraftOutcomes({});
      setApplyError(null);
      setSheetMode('success');
      setLoading(false);
      invalidatePauseStatsDataForUser(user.id);
    },
    [user, t, setPending, pendingRef],
  );

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setSheetOpen(true);
        return;
      }
      if (loadingRef.current) return;

      const drafts = draftRef.current;
      const pend = pendingRef.current;
      const draftKeys = Object.keys(drafts);

      if (sheetModeRef.current === 'review' && pend.length > 0 && draftKeys.length > 0) {
        void (async () => {
          setApplyError(null);
          await applyOutcomesAndFinish((p) => drafts[p.id] ?? 'held');
        })();
        return;
      }

      setSheetOpen(false);
      resetSheetUi();
    },
    [applyOutcomesAndFinish, resetSheetUi, draftRef, loadingRef, pendingRef, sheetModeRef],
  );

  const handleHoldAll = useCallback(() => applyOutcomesAndFinish(() => 'held'), [applyOutcomesAndFinish]);

  const handleReviewHeldAll = useCallback(() => {
    setDraftOutcomes({});
    return applyOutcomesAndFinish(() => 'held');
  }, [applyOutcomesAndFinish]);

  const handleReviewHeldRest = useCallback(
    () => applyOutcomesAndFinish((p) => draftRef.current[p.id] ?? 'held'),
    [applyOutcomesAndFinish, draftRef],
  );

  const handleDismissTeaser = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setDismissed(true);
      setPending([]);
      setSheetOpen(false);
      resetSheetUi();
    },
    [resetSheetUi, setPending],
  );

  const goArchivePauses = useCallback(() => {
    navigate('/archive?seg=pauses');
    setSheetOpen(false);
    resetSheetUi();
  }, [navigate, resetSheetUi]);

  const goEchoes = useCallback(() => {
    navigate('/archive?seg=echoes');
    setSheetOpen(false);
    resetSheetUi();
  }, [navigate, resetSheetUi]);

  const doneAfterSuccess = useCallback(() => {
    setSheetOpen(false);
    resetSheetUi();
  }, [resetSheetUi]);

  const enterReview = useCallback(() => {
    hapticFeedback('light');
    setApplyError(null);
    setDraftOutcomes({});
    setSheetMode('review');
  }, []);

  const exitReviewToPrompt = useCallback(() => {
    hapticFeedback('light');
    setSheetMode('prompt');
    setDraftOutcomes({});
    setApplyError(null);
  }, []);

  const handleDoneInReview = useCallback(() => {
    if (Object.keys(draftRef.current).length > 0) {
      return applyOutcomesAndFinish((p) => draftRef.current[p.id] ?? 'held');
    }
    exitReviewToPrompt();
  }, [applyOutcomesAndFinish, exitReviewToPrompt, draftRef]);

  const onOutcomeChange = useCallback((pauseId: string, outcome: BulkHoldOutcomeChoice) => {
    setDraftOutcomes((prev) => ({ ...prev, [pauseId]: outcome }));
  }, []);

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
            <div className="flex items-center gap-1 text-xs font-medium text-nox-text-link">
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
                <BulkHoldSuccessBody heldCount={heldCount} onViewEchoes={goEchoes} />
              ) : sheetMode === 'review' ? (
                <BulkHoldReviewBody
                  sections={groupedReview}
                  draftOutcomes={draftOutcomes}
                  onOutcomeChange={onOutcomeChange}
                  onOpenArchive={goArchivePauses}
                />
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
                  className="h-11 rounded-xl border-border font-semibold text-nox-text-link hover:bg-muted/40"
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
                  className="h-11 rounded-full border-border bg-muted/30 font-semibold text-foreground hover:bg-muted/50"
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
