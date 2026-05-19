import { useTranslation } from 'react-i18next';
import { Loader2, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionSkeleton } from '@/screens/home/components/SubscriptionSkeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import { HomePauseEmptyFlow } from '@/screens/home/components/HomePauseEmptyFlow';
import { HomePauseBlockingErrorPanel } from '@/screens/home/components/HomePauseBlockingErrorPanel';
import { HomePauseContextMeta } from '@/screens/home/components/HomePauseContextMeta';
import { BulkHoldCard } from '@/screens/home/components/BulkHoldCard';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';
import { shouldSurfacePauseWidgetError } from '@/lib/home-pause-widget-error';
import type { BtcPriceData } from '@/features/market/public';
import { usePendingPauseOffer } from '@/screens/pause/hooks/use-pending-pause-offer';
import type { Entitlement } from '@/features/subscription/public';

interface HomePauseCardBodyProps {
  subLoading: boolean;
  hasAccess: boolean;
  entitlement: Entitlement;
  checkoutLoading: boolean;
  trialLoading: boolean;
  onStartCheckoutPro: () => void;
  onStartTrial: () => void;
  onReactivate: () => void;
  hasOpenPause: boolean;
  openPauseState: 'active' | 'engaged' | null;
  contextPreview: { btc24h: string | null; marketSentiment: string | null };
  onPauseWithThis: () => void;
  /** Pending-context banner CTA (PostHog + navigate); falls back to {@link onPauseWithThis} if omitted. */
  onPauseWithThisFromPendingBanner?: () => void;
  /** Ends the open pause via `pause_dismiss_current` (clears pending too). Shown with reflection CTAs. */
  onDismissOpenPause: () => void;
  loading: boolean;
  error: string | null;
  btcData: BtcPriceData | null;
  onReflectionRetry: () => void;
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  onNeedPause: () => void;
}

/** “Your pause” widget body: subscription gate, reflection CTA, loading, errors, empty flow. */
export function HomePauseCardBody({
  subLoading,
  hasAccess,
  entitlement,
  checkoutLoading,
  trialLoading,
  onStartCheckoutPro,
  onStartTrial,
  onReactivate,
  hasOpenPause,
  openPauseState,
  contextPreview,
  onPauseWithThis,
  onPauseWithThisFromPendingBanner,
  onDismissOpenPause,
  loading,
  error,
  btcData,
  onReflectionRetry,
  showPauseScheduling,
  autoCooldownRemaining,
  cooldownHours,
  nextCronCheckIn,
  manualCooldownRemaining,
  onNeedPause,
}: HomePauseCardBodyProps) {
  const { t } = useTranslation();
  const { pending } = usePendingPauseOffer();
  const onPendingBannerPause = onPauseWithThisFromPendingBanner ?? onPauseWithThis;
  const blockingError = error && shouldSurfacePauseWidgetError(error, btcData) ? error : null;
  const pausePrimaryCta =
    openPauseState === 'engaged'
      ? t('home.pauseCtaEngaged')
      : t('home.pauseCtaActive');

  return (
    <div className="space-y-4">
      <BulkHoldCard />

      {!subLoading && !hasAccess ? (
        <div className="space-y-3">
          <p className={homeInWidget.bodyMuted}>
            {entitlement === 'lapsed'
              ? t('home.subscription.trialEnded', {
                  defaultValue: 'Your free trial has ended. Subscribe to start and complete pauses again.',
                })
              : t('home.subscription.startTrialPrompt', {
                  defaultValue: 'Start your free trial to use Pause when markets move.',
                })}
          </p>
          <LoadingButton
            onClick={entitlement === 'lapsed' ? onReactivate : onStartTrial}
            loading={entitlement === 'lapsed' ? checkoutLoading : trialLoading}
            loadingText={
              entitlement === 'lapsed'
                ? t('home.subscription.openingCheckout')
                : t('onboarding.ready.startingTrial', { defaultValue: 'Starting trial…' })
            }
            className="w-full text-sm font-medium mt-4"
          >
            {entitlement === 'lapsed'
              ? t('pro.upgradeCta')
              : t('home.subscription.startTrialCta', { defaultValue: 'Start free trial' })}
          </LoadingButton>
        </div>
      ) : subLoading ? (
        <SubscriptionSkeleton variant="inline" />
      ) : (
        <>
          {hasOpenPause ? (
            <div className="space-y-4">
              {pending ? (
                <div
                  className="rounded-lg border border-nox-accent-mustard/35 bg-nox-accent-mustard/10 px-3 py-2.5 text-xs leading-snug text-foreground/95"
                  role="status"
                >
                  <p className="font-medium text-foreground">{t('home.pendingQueuedTitle')}</p>
                  <p className="mt-1 text-foreground/85">{t('home.pendingQueuedBody')}</p>
                  <button
                    type="button"
                    onClick={onPendingBannerPause}
                    className="mt-2 w-full rounded-lg border border-nox-accent-mustard/45 bg-background/80 px-2 py-1.5 text-center text-xs font-medium text-foreground hover:bg-background"
                  >
                    {t('home.pendingQueuedCta')}
                  </button>
                </div>
              ) : null}
              <HomePauseContextMeta
                btc24h={contextPreview.btc24h}
                marketSentiment={contextPreview.marketSentiment}
                className="min-w-0"
              />
              <button
                type="button"
                onClick={onPauseWithThis}
                className={cn(homeInWidget.ctaPrimary, 'bg-foreground text-background hover:bg-foreground/90')}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-background" aria-hidden />
                {pausePrimaryCta}
              </button>
              <button
                type="button"
                onClick={onDismissOpenPause}
                title={t('home.pauseDismissHint', {
                  defaultValue: 'Ends this open pause without finishing the ritual. You can start a new one anytime.',
                })}
                className="w-full rounded-lg border border-border/80 bg-transparent px-3 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
              >
                {t('home.pauseDismissCta', { defaultValue: 'Dismiss pause' })}
              </button>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="space-y-4">
                  <div className={homeInWidget.loadingRow}>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    <p className={homeInWidget.bodyMuted}>
                      {t('home.openingPause', { defaultValue: 'Opening your pause…' })}
                    </p>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : blockingError ? (
                <HomePauseBlockingErrorPanel error={blockingError} onTryAgain={onReflectionRetry} />
              ) : (
                <HomePauseEmptyFlow
                  showPauseScheduling={showPauseScheduling}
                  autoCooldownRemaining={autoCooldownRemaining}
                  cooldownHours={cooldownHours}
                  nextCronCheckIn={nextCronCheckIn}
                  onNeedPause={onNeedPause}
                  manualCooldownRemaining={manualCooldownRemaining}
                  pauseLoading={loading}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
