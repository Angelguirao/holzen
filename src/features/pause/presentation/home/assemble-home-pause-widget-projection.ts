import {
  homePauseWidgetSectionTitleKey,
  homePauseWidgetSurfaceIsCollapsible,
  homePauseWidgetSurfaceIsCollapsed,
} from '@/features/pause/domain/home/home-pause-widget-surface';
import type {
  AssembleHomePauseWidgetProjectionInput,
  HomePauseWidgetBodyActions,
  HomePauseWidgetProjection,
} from '@/features/pause/domain/home/home-pause-widget-projection-types';

/** Presentation-layer assembly of chrome + nested body DTO (includes action handlers). */
export function assembleHomePauseWidgetProjection(
  input: AssembleHomePauseWidgetProjectionInput,
): Omit<HomePauseWidgetProjection, 'onToggleCollapse'> {
  const { surface, display, subscription, actions } = input;
  const bodyActions: HomePauseWidgetBodyActions = {
    pendingOfferBusy: actions.pendingOfferBusy,
    onPauseWithThis: actions.onNavigatePauseWithThis,
    onOpenWelcomeBackSheet: actions.onOpenWelcomeBackSheet,
    onPauseWithNewContext: () => void actions.onAdoptPendingOffer(),
    onDeclinePendingOffer: () => void actions.onDeclinePendingOffer(),
    onDismissOpenPause: actions.onDismissOpenPause,
    onReflectionRetry: actions.manualTrigger,
    nextCronCheckIn: actions.nextCronCheckIn,
    manualCooldownRemaining: actions.manualCooldownRemaining,
    onNeedPause: actions.onNeedPause,
    onPauseAgain: actions.onNeedPause,
    onStartCheckoutPro: actions.onStartCheckoutPro,
    onStartTrial: actions.onStartTrial,
    onReactivate: actions.onReactivate,
  };

  return {
    sectionTitleKey: homePauseWidgetSectionTitleKey(surface),
    showMoonIcon: true,
    collapsible: homePauseWidgetSurfaceIsCollapsible(surface),
    collapsed: homePauseWidgetSurfaceIsCollapsed(surface),
    body: {
      surface,
      display,
      subscription,
      actions: bodyActions,
    },
  };
}
