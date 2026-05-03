import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionSkeleton } from '@/components/SubscriptionSkeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import { HomePauseEmptyFlow } from '@/components/home/HomePauseEmptyFlow';
import { HomePauseBlockingErrorPanel } from '@/components/home/HomePauseBlockingErrorPanel';
import { HomePauseContextMeta } from '@/components/home/HomePauseContextMeta';
import { BulkHoldCard } from '@/components/BulkHoldCard';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';
import { shouldSurfacePauseWidgetError } from '@/lib/home-pause-widget-error';
import type { BtcPriceData } from '@/lib/btc';

interface HomePauseCardBodyProps {
  subLoading: boolean;
  hasAccess: boolean;
  subscribed: boolean;
  monthlyRemaining: number | undefined;
  checkoutLoading: boolean;
  onStartCheckoutPro: () => void;
  message: string | null;
  contextPreview: { btc24h: string | null; marketSentiment: string | null };
  onPauseWithThis: () => void;
  loading: boolean;
  error: string | null;
  btcData: BtcPriceData | null;
  onReflectionRetry: () => void;
  pinnedPreview: ReactNode;
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
  subscribed,
  monthlyRemaining,
  checkoutLoading,
  onStartCheckoutPro,
  message,
  contextPreview,
  onPauseWithThis,
  loading,
  error,
  btcData,
  onReflectionRetry,
  pinnedPreview,
  showPauseScheduling,
  autoCooldownRemaining,
  cooldownHours,
  nextCronCheckIn,
  manualCooldownRemaining,
  onNeedPause,
}: HomePauseCardBodyProps) {
  const { t } = useTranslation();
  const blockingError = error && shouldSurfacePauseWidgetError(error, btcData) ? error : null;

  return (
    <div className="space-y-4">
      <BulkHoldCard />

      {!subLoading && !hasAccess ? (
        <div className="space-y-3">
          <p className={homeInWidget.bodyMuted}>{t('home.subscription.monthlyLimitReached')}</p>
          <p className={`${homeInWidget.meta} mb-[16px]`}>{t('home.subscription.upgradeToPro')}</p>
          <LoadingButton
            onClick={onStartCheckoutPro}
            loading={checkoutLoading}
            loadingText={t('home.subscription.openingCheckout')}
            className="w-full text-sm font-medium mt-4"
          >
            {t('pro.upgradeCta')}
          </LoadingButton>
        </div>
      ) : subLoading ? (
        <SubscriptionSkeleton variant="inline" />
      ) : (
        <>
          {!subscribed && monthlyRemaining !== undefined && monthlyRemaining > 0 && (
            <p className={homeInWidget.meta}>{t('home.subscription.freeRemaining', { count: monthlyRemaining })}</p>
          )}

          {message ? (
            <div className="space-y-4">
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
                {t('onboarding.pauseWithThis')}
              </button>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="space-y-4">
                  <div className={homeInWidget.loadingRow}>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    <p className={homeInWidget.bodyMuted}>{t('home.generatingReflection')}</p>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : blockingError ? (
                <HomePauseBlockingErrorPanel error={blockingError} onTryAgain={onReflectionRetry} />
              ) : (
                <HomePauseEmptyFlow
                  pinnedPreview={pinnedPreview}
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
