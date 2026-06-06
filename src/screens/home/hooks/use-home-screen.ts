import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { usePauseHomeContext } from '@/features/pause/public-home';
import { useAuth } from '@/features/auth/public';
import { useHolzenCommunityStatsRealtime, useProfile } from '@/features/user/public-hooks';
import {
  useCompletedPauseCount,
  useDismissOutletPauseReady,
  useHomePauseActions,
  useHomePendingPauseOfferActions,
  useHomePracticeStats,
  usePauseArrivalAudio,
} from '@/features/pause/public-home';
import { isBitcoinTrackedAsset } from '@/features/market/public';
import { useMarketDisplayPreferences } from '@/features/market/public-hooks';
import { getHomeSubscriptionGate } from '@/features/subscription/public';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useWidgetLayout } from '@/screens/home/components/HomeWidget';
import { HOME_WIDGET_DEFAULT_ORDER } from '@/screens/home/lib/home-section-visibility-constants';
import type { HomeAppLayoutOutletContext } from '@/screens/home/lib/home-app-layout-outlet';
import { useHomeCheckoutWelcomeToast } from '@/screens/home/hooks/use-home-checkout-welcome-toast';
import { useHomeCustomizeBridge } from '@/screens/home/hooks/use-home-customize-bridge';
import { useHomeDashboardLayoutProps } from '@/screens/home/hooks/use-home-dashboard-layout-props';
import { useHomeDashboardTodayWiring } from '@/screens/home/hooks/use-home-dashboard-today-wiring';
import { useHomeDocumentTitle } from '@/screens/home/hooks/use-home-document-title';
import { useHomeMarketGoalHeaders } from '@/screens/home/hooks/use-home-market-goal-headers';
import { useHomeOptionalVisibility } from '@/screens/home/hooks/use-home-optional-visibility';
import { useHomePauseCardProjection } from '@/screens/home/hooks/use-home-pause-card-projection';
import { useHomePullFullReload } from '@/screens/home/hooks/use-home-pull-full-reload';
import { useHomeVisibleSections } from '@/screens/home/hooks/use-home-visible-sections';
import { useHomePrefetch } from '@/screens/home/hooks/use-home-prefetch';

/**
 * Home route conductor — composes Holzen outlet, subscription gate, pause card, and dashboard layout.
 */
export function useHomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    subscribed,
    loading: subLoading,
    entitlement,
    checkoutLoading,
    trialLoading,
    startCheckout,
    startReactivationCheckout,
    ensureTrial,
    refresh,
  } = useSubscription();
  const [searchParams] = useSearchParams();
  useHomeCheckoutWelcomeToast(searchParams.get('subscribed'), refresh, t);
  useHomeDocumentTitle(true);

  const {
    marketData,
    message,
    context,
    companions,
    severity,
    lastPauseInstanceId,
    openPauseState,
    contextSnapshot,
    hasReflectionStep,
    hasOpenPauseStepEvents,
    openPauseCreatedAt,
    loading,
    error,
    newPauseArrival,
    clearNewPauseArrival,
    dismissMessage,
    manualTrigger,
    manualCooldownRemaining,
    autoCooldownRemaining,
    nextCronCheckIn,
  } = usePauseHomeContext();

  const {
    companionPrefs,
    cooldownHours,
    firstName,
    currency,
    trackedAssetId,
    threshold,
    thresholdDown,
    cumulativeThreshold,
    profileLoaded,
    lastTriggerAt: profileLastTriggerAt,
  } = useProfile();

  useHomePrefetch({
    userId: user?.id,
    coinIdRaw: trackedAssetId,
    currency,
  });

  useHolzenCommunityStatsRealtime(Boolean(user?.id));

  const hasOpenPause = Boolean(lastPauseInstanceId);
  const marketCommunityPauseInProgress =
    hasOpenPause && (hasOpenPauseStepEvents || openPauseState === 'engaged');

  const { subscriptionReady, hasAccess, showPauseScheduling } = getHomeSubscriptionGate({
    subLoading,
    entitlement,
    hasOpenPause,
    loading,
  });

  const outletCtx = useOutletContext<HomeAppLayoutOutletContext>();
  const pauseReady = outletCtx?.pauseReady ?? false;
  const dismissPauseReady = outletCtx?.dismissPauseReady;
  useDismissOutletPauseReady(pauseReady, hasOpenPause, dismissPauseReady);
  usePauseArrivalAudio(newPauseArrival, lastPauseInstanceId, clearNewPauseArrival);

  const {
    priceHidden,
    unitBasisMode,
    marketChartExpanded,
    marketChartExpandBlocked,
    togglePriceHidden,
    toggleUnitBasisMode,
    toggleMarketChartExpanded,
  } = useMarketDisplayPreferences();
  const unitBasisModeSupported = isBitcoinTrackedAsset(trackedAssetId);
  const completedPauseCount = useCompletedPauseCount() ?? 0;
  const { stats: practiceStats, isLoading: practiceStatsLoading } = useHomePracticeStats();

  const { order, collapsed, reorder, toggleCollapsed, resetLayout } = useWidgetLayout(
    HOME_WIDGET_DEFAULT_ORDER,
    user?.id,
  );
  const { visible: sectionVisible, setVisible, resetVisibility: resetSectionVisibility } =
    useHomeOptionalVisibility(user?.id);

  const { visibleOrderedSectionIds, todaySectionIds } = useHomeVisibleSections({
    order,
    sectionVisible,
  });

  const { customizeSheet, onOpenCustomize } = useHomeCustomizeBridge({
    t,
    order,
    reorder,
    sectionVisible,
    setVisible,
    resetLayout,
    resetSectionVisibility,
  });

  const { marketHeaderRight } = useHomeMarketGoalHeaders({
    t,
    marketChartExpanded,
    marketChartExpandBlocked,
    toggleMarketChartExpanded,
  });

  const pauseActions = useHomePauseActions({
    message,
    context,
    lastPauseInstanceId,
    companions,
    companionPrefs,
    severity,
    navigate,
    dismissMessage,
    manualTrigger,
    manualCooldownRemaining,
    startCheckout,
    dismissAnalyticsSurface: 'home_your_pause_widget',
  });

  const pendingOfferActions = useHomePendingPauseOfferActions(navigate);

  const pauseProjection = useHomePauseCardProjection({
    subscriptionReady,
    hasAccess,
    subLoading,
    entitlement,
    checkoutLoading,
    trialLoading,
    hasOpenPause,
    openPauseState,
    loading,
    error,
    marketData,
    showPauseScheduling,
    autoCooldownRemaining,
    cooldownHours,
    nextCronCheckIn,
    manualCooldownRemaining,
    manualTrigger,
    onNavigatePauseWithThis: pauseActions.handleNavigatePauseWithThis,
    onAdoptPendingOffer: pendingOfferActions.adoptPendingOffer,
    onDeclinePendingOffer: pendingOfferActions.declinePendingOffer,
    pendingOfferBusy: pendingOfferActions.pendingOfferBusy,
    onDismissOpenPause: pauseActions.handleDismiss,
    onNeedPause: pauseActions.handleNeedAPause,
    onStartCheckoutPro: pauseActions.startProCheckout,
    onStartTrial: () => void ensureTrial(),
    onReactivate: () => void startReactivationCheckout(),
    hasReflectionStep,
    hasOpenPauseStepEvents,
    reflectionMessage: message,
    contextSnapshot,
    openPauseCreatedAt,
    contextText: context,
    completedPauseCount,
    trackedAssetId,
    newPauseArrival,
    profileLastTriggerAt,
  });

  const { pullDistance, refreshing: pullRefreshing, handlers: pullHandlers } = useHomePullFullReload();

  const { renderSection, goalWhyBlock } = useHomeDashboardTodayWiring(
    {
      t,
      error,
      marketHeaderRight,
      marketData,
      threshold,
      thresholdDown,
      cumulativeThreshold,
      marketCommunityPauseInProgress,
      priceHidden,
      togglePriceHidden,
      currency,
      trackedAssetId,
      unitBasisModeSupported,
      unitBasisMode,
      toggleUnitBasisMode,
      marketChartExpanded,
      toggleMarketChartExpanded,
      pauseCardBody: pauseProjection.pauseCardBody,
      pauseSectionHeaderRight: pauseProjection.pauseSectionHeaderRight,
      pauseWidgetProjection: pauseProjection.pauseWidgetProjection,
      subscribed,
      collapsed,
      toggleCollapsed,
      presenceXp: practiceStats?.presenceXp ?? null,
      completedPauseCount: practiceStats?.completedPauseCount ?? null,
      practiceStatsLoading,
    },
    visibleOrderedSectionIds,
  );

  const dashboardLayout = useHomeDashboardLayoutProps({
    pullHandlers,
    pullDistance,
    pullRefreshing,
    userId: user?.id,
    firstName,
    todaySectionIds,
    goalWhyBlock,
    renderSection,
    onOpenCustomize,
    customize: customizeSheet,
    completedPauseCount,
  });

  return {
    profileLoaded,
    dashboardLayout,
  };
}
