import {
  homePauseWidgetModeIsCollapsible,
  homePauseWidgetModeIsCollapsed,
  homePauseWidgetSectionTitleKey,
} from '@/features/pause/domain/home/home-pause-widget-mode';
import type {
  BuildHomePauseWidgetProjectionInput,
  HomePauseWidgetProjection,
} from '@/features/pause/domain/home/home-pause-widget-projection-types';

/** Pure assembly of chrome + body DTO — no React, no side effects. */
export function buildHomePauseWidgetProjection(
  input: BuildHomePauseWidgetProjectionInput,
): Omit<HomePauseWidgetProjection, 'onToggleCollapse'> {
  const { widgetMode, previewLine, marketBlock, pendingMarketBlock, params } = input;
  const collapsible = homePauseWidgetModeIsCollapsible(widgetMode);
  const collapsed = homePauseWidgetModeIsCollapsed(widgetMode);

  return {
    sectionTitleKey: homePauseWidgetSectionTitleKey(widgetMode),
    showMoonIcon: true,
    collapsible,
    collapsed,
    body: {
      widgetMode,
      previewLine,
      marketBlock,
      pendingMarketBlock,
      postManualCooldownIdle: input.postManualCooldownIdle,
      engagedPauseMarketSettled: input.engagedPauseMarketSettled,
      openPauseOpenMaxAnchorAt: input.openPauseOpenMaxAnchorAt,
      openPauseState: params.openPauseState,
      manualCooldownRemainingMs: input.manualCooldownRemainingMs,
      completedPauseCount: params.completedPauseCount ?? 0,
      profileLastTriggerAt: params.profileLastTriggerAt,
      subLoading: params.subLoading,
      hasAccess: params.hasAccess,
      entitlement: params.entitlement,
      checkoutLoading: params.checkoutLoading,
      trialLoading: params.trialLoading,
      loading: params.loading,
      error: params.error,
      marketData: params.marketData,
      showPauseScheduling: params.showPauseScheduling,
      cooldownHours: params.cooldownHours,
      pendingOfferBusy: params.pendingOfferBusy,
      onPauseWithThis: params.onNavigatePauseWithThis,
      onPauseWithNewContext: () => void params.onAdoptPendingOffer(),
      onDeclinePendingOffer: () => void params.onDeclinePendingOffer(),
      onDismissOpenPause: params.onDismissOpenPause,
      onReflectionRetry: params.manualTrigger,
      autoCooldownRemaining: params.autoCooldownRemaining,
      nextCronCheckIn: params.nextCronCheckIn,
      manualCooldownRemaining: params.manualCooldownRemaining,
      onNeedPause: params.onNeedPause,
      onPauseAgain: params.onNeedPause,
      onStartCheckoutPro: params.onStartCheckoutPro,
      onStartTrial: params.onStartTrial,
      onReactivate: params.onReactivate,
    },
  };
}
