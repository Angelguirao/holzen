import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionSkeleton } from '@/screens/home/components/SubscriptionSkeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import { HomePauseBlockingErrorPanel } from '@/screens/home/components/HomePauseBlockingErrorPanel';
import {
  HomePauseEngagedBody,
  HomePauseEngagedPendingBody,
  HomePauseIdleExpandedBody,
  HomePauseOpenActiveBody,
  HomePausePostPauseBody,
} from '@/screens/home/components/HomePauseWidgetBodies';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { shouldSurfacePauseWidgetError } from '@/features/pause/public-home';
import type { HomePauseWidgetBodyProjection } from '@/features/pause/public-home';

type Props = HomePauseWidgetBodyProjection;

/** Routes Home “Your pause” widget body by derived {@link HomePauseWidgetBodyProjection.surface}. */
export function HomePauseWidgetBody({ surface, display, subscription, actions }: Props) {
  "use memo";
  const { t } = useTranslation();

  const blockingError =
    display.error && shouldSurfacePauseWidgetError(display.error, display.marketData)
      ? display.error
      : null;

  if (!subscription.subLoading && !subscription.hasAccess) {
    return (
      <div className="space-y-3">
        <p className={homeInWidget.bodyMuted}>
          {subscription.entitlement === 'lapsed'
            ? t('home.subscription.trialEnded', {
                defaultValue: 'Your free trial has ended. Subscribe to start and complete pauses again.',
              })
            : t('home.subscription.startTrialPrompt', {
                defaultValue: 'Start your free trial to use Pause when markets move.',
              })}
        </p>
        <LoadingButton
          onClick={
            subscription.entitlement === 'lapsed' ? actions.onReactivate : actions.onStartTrial
          }
          loading={
            subscription.entitlement === 'lapsed'
              ? subscription.checkoutLoading
              : subscription.trialLoading
          }
          loadingText={
            subscription.entitlement === 'lapsed'
              ? t('home.subscription.openingCheckout')
              : t('onboarding.ready.startingTrial', { defaultValue: 'Starting trial…' })
          }
          className="w-full text-sm font-medium mt-4"
        >
          {subscription.entitlement === 'lapsed'
            ? t('pro.upgradeCta')
            : t('home.subscription.startTrialCta', { defaultValue: 'Start free trial' })}
        </LoadingButton>
      </div>
    );
  }

  if (subscription.subLoading) {
    return <SubscriptionSkeleton variant="inline" />;
  }

  switch (surface) {
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
        <HomePauseBlockingErrorPanel error={blockingError} onTryAgain={actions.onReflectionRetry} />
      ) : null;

    case 'open_pre_reflect':
      return (
        <HomePauseOpenActiveBody
          previewLine={display.previewLine}
          marketBlock={display.marketBlock}
          onPauseWithThis={actions.onPauseWithThis}
          ctaLabelKey="home.pauseIdle.letsPauseCta"
        />
      );

    case 'open_engaged':
      return (
        <HomePauseEngagedBody
          onPauseWithThis={actions.onPauseWithThis}
          onDismissOpenPause={actions.onDismissOpenPause}
          engagedPauseMarketSettled={display.engagedPauseMarketSettled}
          openPauseOpenMaxAnchorAt={display.openPauseOpenMaxAnchorAt}
        />
      );

    case 'open_engaged_pending_offer':
      return (
        <HomePauseEngagedPendingBody
          pendingMarketBlock={display.pendingMarketBlock}
          onPauseWithThis={actions.onPauseWithThis}
          onDismissOpenPause={actions.onDismissOpenPause}
          onPauseWithNewContext={actions.onPauseWithNewContext}
          pendingOfferBusy={actions.pendingOfferBusy}
        />
      );

    case 'manual_cooldown_collapsed':
    case 'manual_cooldown_expanded':
    case 'manual_cooldown_first_pause_collapsed':
    case 'manual_cooldown_first_pause_expanded':
      return (
        <HomePausePostPauseBody
          surface={surface}
          onPauseWithThis={actions.onPauseWithThis}
          previewLine={display.previewLine}
          marketBlock={display.marketBlock}
          manualCooldownRemainingMs={display.manualCooldownRemainingMs}
          completedPauseCount={display.completedPauseCount}
        />
      );

    case 'idle_expanded':
      return (
        <HomePauseIdleExpandedBody
          onNeedPause={actions.onNeedPause}
          loading={display.loading}
          postManualCooldownIdle={display.postManualCooldownIdle}
        />
      );

    case 'idle_collapsed':
      return null;

    default:
      return null;
  }
}
