import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { usePauseHomeContext } from '@/features/pause/public-home';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import {
  useCompletedPauseCount,
  useDismissOutletPauseReady,
  useHomePauseActions,
  usePauseArrivalAudio,
  usePauseContextHomePreviews,
} from '@/features/pause/public-home';
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
import { useHomeHeroQuoteViewed } from '@/screens/home/hooks/use-home-hero-quote-viewed';
import { useHomeMarketGoalHeaders } from '@/screens/home/hooks/use-home-market-goal-headers';
import { useHomeOptionalVisibility } from '@/screens/home/hooks/use-home-optional-visibility';
import { useHomePauseCardProjection } from '@/screens/home/hooks/use-home-pause-card-projection';
import { useHomePullFullReload } from '@/screens/home/hooks/use-home-pull-full-reload';
import { useHomeVisibleSections } from '@/screens/home/hooks/use-home-visible-sections';

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
    btcData,
    message,
    context,
    companions,
    severity,
    lastPauseInstanceId,
    openPauseState,
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
    hasOnboarded,
    completeOnboarding,
    cooldownHours,
    firstName,
    currency,
    trackedAssetId,
    profileLoaded,
  } = useProfile();

  const hasOpenPause = Boolean(lastPauseInstanceId);

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
  useHomeHeroQuoteViewed(profileLoaded, user?.id);
  usePauseArrivalAudio(newPauseArrival, lastPauseInstanceId, clearNewPauseArrival);

  const {
    priceHidden,
    btcMode,
    marketChartExpanded,
    marketChartExpandBlocked,
    togglePriceHidden,
    toggleBtcMode,
    toggleMarketChartExpanded,
  } = useMarketDisplayPreferences();
  const unitBasisModeSupported = trackedAssetId === 'bitcoin';
  const completedPauseCount = useCompletedPauseCount() ?? 0;
  const pauseContextHomePreview = usePauseContextHomePreviews(context);

  const [goalWhyHoldSummary, setGoalWhyHoldSummary] = useState<string | null>(null);

  const { order, collapsed, reorder, toggleCollapsed, resetLayout } = useWidgetLayout(
    HOME_WIDGET_DEFAULT_ORDER,
  );
  const { visible: sectionVisible, setVisible, resetVisibility: resetSectionVisibility } =
    useHomeOptionalVisibility();

  const { visibleOrderedSectionIds, todaySectionIds } = useHomeVisibleSections({
    order,
    sectionVisible,
    subscribed,
    hasNightReflection: false,
  });

  const { customizeSheet, onOpenCustomize } = useHomeCustomizeBridge({
    t,
    order,
    reorder,
    sectionVisible,
    setVisible,
    resetLayout,
    resetSectionVisibility,
    subscribed,
  });

  const { goalWhyExpanded, goalWhyHeaderRight, marketHeaderRight } = useHomeMarketGoalHeaders({
    t,
    marketChartExpanded,
    marketChartExpandBlocked,
    toggleMarketChartExpanded,
  });

  const pauseActions = useHomePauseActions({
    message,
    context,
    lastPauseInstanceId,
    openPauseState,
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

  const pauseProjection = useHomePauseCardProjection({
    subscriptionReady,
    hasAccess,
    subLoading,
    entitlement,
    checkoutLoading,
    trialLoading,
    hasOpenPause,
    openPauseState,
    pauseContextHomePreview,
    loading,
    error,
    btcData,
    showPauseScheduling,
    autoCooldownRemaining,
    cooldownHours,
    nextCronCheckIn,
    manualCooldownRemaining,
    manualTrigger,
    onNavigatePauseWithThis: pauseActions.handleNavigatePauseWithThis,
    onNavigatePauseFromPendingBanner: pauseActions.handleNavigatePauseWithThisFromPendingBanner,
    onDismissOpenPause: pauseActions.handleDismiss,
    onNeedPause: pauseActions.handleNeedAPause,
    onStartCheckoutPro: pauseActions.startProCheckout,
    onStartTrial: () => void ensureTrial(),
    onReactivate: () => void startReactivationCheckout(),
  });

  const { pullDistance, refreshing: pullRefreshing, handlers: pullHandlers } = useHomePullFullReload();

  const { renderSection, goalWhyBlock } = useHomeDashboardTodayWiring(
    {
      t,
      goalWhyHoldSummary,
      setGoalWhyHoldSummary,
      goalWhyHeaderRight,
      goalWhyExpanded,
      error,
      marketHeaderRight,
      btcData,
      priceHidden,
      togglePriceHidden,
      currency,
      trackedAssetId,
      unitBasisModeSupported,
      btcMode,
      toggleBtcMode,
      marketChartExpanded,
      toggleMarketChartExpanded,
      pauseCardBody: pauseProjection.pauseCardBody,
      pauseSectionHeaderRight: pauseProjection.pauseSectionHeaderRight,
      subscribed,
      collapsed,
      toggleCollapsed,
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
    hasOnboarded,
    completeOnboarding,
    dashboardLayout,
  };
}
