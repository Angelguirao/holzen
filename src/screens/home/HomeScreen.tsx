import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/app/components/HolzenProvider';
import AuthLoading from '@/app/components/AuthLoading';
import { useSubscription } from '@/features/subscription/public-hooks';
import { Onboarding } from '@/screens/home/components/Onboarding';
import { useWidgetLayout } from '@/screens/home/components/HomeWidget';
import { HomeDashboardLayout } from '@/screens/home/components/HomeDashboardLayout';
import { HomeZenModeRoute } from '@/screens/home/components/HomeZenModeRoute';
import { useHomeOptionalVisibility } from '@/screens/home/hooks/use-home-optional-visibility';
import { HOME_WIDGET_DEFAULT_ORDER } from '@/screens/home/lib/home-section-visibility-constants';
import { useHomeCheckoutWelcomeToast } from '@/screens/home/hooks/use-home-checkout-welcome-toast';
import { useHomeZenMode } from '@/screens/home/hooks/use-home-zen-mode';
import { useHomeCompletedPauseCount } from '@/screens/home/hooks/use-home-completed-pause-count';
import { useHomeOutletPauseReady } from '@/screens/home/hooks/use-home-outlet-pause-ready';
import { useHomeDocumentTitle } from '@/screens/home/hooks/use-home-document-title';
import { useHomeHeroQuoteViewed } from '@/screens/home/hooks/use-home-hero-quote-viewed';
import {
  useHomePauseActions,
  usePauseArrivalAudio,
  usePauseContextHomePreviews,
  useZenModeHomeRouteProps,
} from '@/features/pause/public-hooks';
import { useHomeMarketDisplayPreferences } from '@/screens/home/hooks/use-home-market-display-preferences';
import { useState } from 'react';
import { useOutletContext, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/public';
import { useHomeVisibleSections } from '@/screens/home/hooks/use-home-visible-sections';
import { useHomeCustomizeBridge } from '@/screens/home/hooks/use-home-customize-bridge';
import { useHomeMarketGoalHeaders } from '@/screens/home/hooks/use-home-market-goal-headers';
import { useHomePauseCardProjection } from '@/screens/home/hooks/use-home-pause-card-projection';
import { useHomeDashboardTodayWiring } from '@/screens/home/hooks/use-home-dashboard-today-wiring';
import { getHomeSubscriptionGate } from '@/features/subscription/public';
import { useHomePullFullReload } from '@/screens/home/hooks/use-home-pull-full-reload';
import { useHomeDashboardLayoutProps } from '@/screens/home/hooks/use-home-dashboard-layout-props';
import type { HomeAppLayoutOutletContext } from '@/screens/home/lib/home-app-layout-outlet';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
    companionPrefs,
    severity,
    lastPauseInstanceId,
    openPauseState,
    loading,
    error,
    newPauseArrival,
    clearNewPauseArrival,
    dismissMessage,
    hasOnboarded,
    completeOnboarding,
    manualTrigger,
    manualCooldownRemaining,
    autoCooldownRemaining,
    nextCronCheckIn,
    cooldownHours,
    firstName,
    currency,
    trackedAssetId,
    profileLoaded,
    refreshProfile,
  } = useHolzen();

  const hasOpenPause = Boolean(lastPauseInstanceId);

  const { subscriptionReady, hasAccess, showLimitUpsell, showPauseScheduling } = getHomeSubscriptionGate({
    subLoading,
    entitlement,
    hasOpenPause,
    loading,
  });

  const outletCtx = useOutletContext<HomeAppLayoutOutletContext>();
  const pauseReady = outletCtx?.pauseReady ?? false;
  const dismissPauseReady = outletCtx?.dismissPauseReady;
  useHomeOutletPauseReady(pauseReady, hasOpenPause, dismissPauseReady);
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
  } = useHomeMarketDisplayPreferences();
  const unitBasisModeSupported = trackedAssetId === 'bitcoin';
  const { zenMode, setZenModePersist } = useHomeZenMode(pathname);
  const completedPauseCount = useHomeCompletedPauseCount(user);
  const pauseContextHomePreview = usePauseContextHomePreviews(context);

  const [goalWhyHoldSummary, setGoalWhyHoldSummary] = useState<string | null>(null);

  const { order, collapsed, reorder, toggleCollapsed, resetLayout } = useWidgetLayout(HOME_WIDGET_DEFAULT_ORDER);
  const { visible: sectionVisible, setVisible, resetVisibility: resetSectionVisibility } = useHomeOptionalVisibility();

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
    setZenModePersist,
    zenMode,
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
    dismissAnalyticsSurface: zenMode ? 'home_zen_reflection' : 'home_your_pause_widget',
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

  const zenRouteProps = useZenModeHomeRouteProps({
    hasOpenPause,
    context,
    contextPreview: pauseContextHomePreview,
    openPauseState,
    loading,
    error,
    btcData,
    onDismiss: pauseActions.handleDismiss,
    onNeedPause: pauseActions.handleNeedAPause,
    onManualTrigger: manualTrigger,
    onPauseWithThis: pauseActions.handleNavigatePauseWithThis,
    subscriptionReady,
    hasAccess,
    showLimitUpsell,
    showPauseScheduling,
    autoCooldownRemaining,
    cooldownHours,
    nextCronCheckIn,
    manualCooldownRemaining,
    checkoutLoading,
    trialLoading,
    entitlement,
    onStartTrial: () => void ensureTrial(),
    onReactivate: () => void startReactivationCheckout(),
  });

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

  if (!profileLoaded) {
    return <AuthLoading />;
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  if (zenMode) {
    return <HomeZenModeRoute {...zenRouteProps} />;
  }

  return <HomeDashboardLayout {...dashboardLayout} />;
};

export default Home;
