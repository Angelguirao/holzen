import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionSkeleton } from '@/screens/home/components/SubscriptionSkeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import { HomePauseBlockingErrorPanel } from '@/screens/home/components/HomePauseBlockingErrorPanel';
import {
  HomePauseCalmWatersBody,
  HomePauseEngagedBody,
  HomePauseEngagedPendingBody,
  HomePauseIdleExpandedBody,
  HomePauseOpenActiveBody,
  HomePausePostPauseBody,
} from '@/screens/home/components/HomePauseWidgetBodies';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { shouldSurfacePauseWidgetError } from '@/features/pause/public-home';
import type { HomePauseWidgetBodyProjection } from '@/features/pause/presentation/home/use-home-pause-widget-projection';

type Props = HomePauseWidgetBodyProjection;

/** Routes Home “Your pause” widget body by Figma-aligned {@link HomePauseWidgetBodyProjection.widgetMode}. */
export function HomePauseWidgetBody(props: Props) {
  "use memo";
  const { t } = useTranslation();
  const calmToastShown = useRef(false);

  useEffect(() => {
    if (props.widgetMode !== 'calm_waters') {
      calmToastShown.current = false;
      return;
    }
    if (calmToastShown.current) return;
    calmToastShown.current = true;
    toast.message(t('home.pauseCalmWaters.toast'), { duration: 5000 });
  }, [props.widgetMode, t]);

  const blockingError =
    props.error && shouldSurfacePauseWidgetError(props.error, props.btcData) ? props.error : null;

  if (!props.subLoading && !props.hasAccess) {
    return (
      <div className="space-y-3">
        <p className={homeInWidget.bodyMuted}>
          {props.entitlement === 'lapsed'
            ? t('home.subscription.trialEnded', {
                defaultValue: 'Your free trial has ended. Subscribe to start and complete pauses again.',
              })
            : t('home.subscription.startTrialPrompt', {
                defaultValue: 'Start your free trial to use Pause when markets move.',
              })}
        </p>
        <LoadingButton
          onClick={props.entitlement === 'lapsed' ? props.onReactivate : props.onStartTrial}
          loading={props.entitlement === 'lapsed' ? props.checkoutLoading : props.trialLoading}
          loadingText={
            props.entitlement === 'lapsed'
              ? t('home.subscription.openingCheckout')
              : t('onboarding.ready.startingTrial', { defaultValue: 'Starting trial…' })
          }
          className="w-full text-sm font-medium mt-4"
        >
          {props.entitlement === 'lapsed'
            ? t('pro.upgradeCta')
            : t('home.subscription.startTrialCta', { defaultValue: 'Start free trial' })}
        </LoadingButton>
      </div>
    );
  }

  if (props.subLoading) {
    return <SubscriptionSkeleton variant="inline" />;
  }

  switch (props.widgetMode) {
    case 'loading':
      return (
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
      );

    case 'blocking_error':
      return blockingError ? (
        <HomePauseBlockingErrorPanel error={blockingError} onTryAgain={props.onReflectionRetry} />
      ) : null;

    case 'calm_waters':
      return (
        <HomePauseCalmWatersBody
          showPauseScheduling={props.showPauseScheduling}
          autoCooldownRemaining={props.autoCooldownRemaining}
          cooldownHours={props.cooldownHours}
          nextCronCheckIn={props.nextCronCheckIn}
        />
      );

    case 'B':
      return (
        <HomePauseOpenActiveBody
          previewLine={props.previewLine}
          marketBlock={props.marketBlock}
          onPauseWithThis={props.onPauseWithThis}
          showPendingQueuedBanner={props.showPendingQueuedBanner}
          pendingPreviewLine={props.pendingPreviewLine}
          pendingMarketBlock={props.pendingMarketBlock}
          onPauseWithNewContext={props.onPauseWithNewContext}
          onDeclinePendingOffer={props.onDeclinePendingOffer}
          pendingOfferBusy={props.pendingOfferBusy}
          ctaLabelKey="home.pauseWidget.pauseWithThis"
        />
      );

    case 'C':
      return (
        <HomePauseEngagedBody
          previewLine={props.previewLine}
          marketBlock={props.marketBlock}
          onPauseWithThis={props.onPauseWithThis}
          onDismissOpenPause={props.onDismissOpenPause}
        />
      );

    case 'C_prime':
      return (
        <HomePauseEngagedPendingBody
          previewLine={props.previewLine}
          marketBlock={props.marketBlock}
          pendingPreviewLine={props.pendingPreviewLine}
          pendingMarketBlock={props.pendingMarketBlock}
          onPauseWithThis={props.onPauseWithThis}
          onDismissOpenPause={props.onDismissOpenPause}
          onPauseWithNewContext={props.onPauseWithNewContext}
          onDeclinePendingOffer={props.onDeclinePendingOffer}
          pendingOfferBusy={props.pendingOfferBusy}
        />
      );

    case 'E':
    case 'D_collapsed':
    case 'D_expanded':
    case 'D_prime_collapsed':
    case 'D_prime_expanded':
      return (
        <HomePausePostPauseBody
          widgetMode={props.widgetMode}
          onPauseAgain={props.onPauseAgain}
          showPauseScheduling={props.showPauseScheduling}
          autoCooldownRemaining={props.autoCooldownRemaining}
          cooldownHours={props.cooldownHours}
          nextCronCheckIn={props.nextCronCheckIn}
          completedPauseCount={props.completedPauseCount}
          onPauseWithThis={props.onPauseWithThis}
          previewLine={props.previewLine}
          marketBlock={props.marketBlock}
        />
      );

    case 'A_expanded':
      return (
        <HomePauseIdleExpandedBody
          showPauseScheduling={props.showPauseScheduling}
          autoCooldownRemaining={props.autoCooldownRemaining}
          cooldownHours={props.cooldownHours}
          nextCronCheckIn={props.nextCronCheckIn}
          onNeedPause={props.onNeedPause}
          manualCooldownRemaining={props.manualCooldownRemaining}
          loading={props.loading}
        />
      );

    case 'A_collapsed':
    default:
      return null;
  }
}
