import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/hooks/use-holzen';
import AuthLoading from '@/components/AuthLoading';
import { useSubscription } from '@/hooks/use-subscription';
import { Onboarding } from '@/components/Onboarding';
import { useWidgetLayout } from '@/components/HomeWidget';
import { HomeDashboardLayout } from '@/components/home/HomeDashboardLayout';
import { HomeZenModeRoute } from '@/components/home/HomeZenModeRoute';
import { useHomeOptionalVisibility } from '@/hooks/use-home-optional-visibility';
import { HOME_WIDGET_DEFAULT_ORDER } from '@/lib/home-section-visibility-constants';
import { useHomeCheckoutWelcomeToast } from '@/hooks/use-home-checkout-welcome-toast';
import { useHomeZenMode } from '@/hooks/use-home-zen-mode';
import { useHomeCompletedPauseCount } from '@/hooks/use-home-completed-pause-count';
import { useHomeOutletPauseReady } from '@/hooks/use-home-outlet-pause-ready';
import { useHomeDocumentTitle } from '@/hooks/use-home-document-title';
import { useHomeHeroQuoteViewed } from '@/hooks/use-home-hero-quote-viewed';
import { useHomePauseAudio } from '@/hooks/use-home-pause-audio';
import { useHomeMarketDisplayPreferences } from '@/hooks/use-home-market-display-preferences';
import { useState } from 'react';
import { useOutletContext, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useNightReflection } from '@/components/NightReflectionCard';
import { useHomeVisibleSections } from '@/hooks/use-home-visible-sections';
import { useHomeCustomizeBridge } from '@/hooks/use-home-customize-bridge';
import { useHomeMarketGoalHeaders } from '@/hooks/use-home-market-goal-headers';
import { useHomePauseActions } from '@/hooks/use-home-pause-actions';
import { useHomePauseCardProjection } from '@/hooks/use-home-pause-card-projection';
import { useHomeDashboardTodayWiring } from '@/hooks/use-home-dashboard-today-wiring';
import { getHomeSubscriptionGate } from '@/lib/home-subscription-gate';
import { useHomePauseContextPreviews } from '@/hooks/use-home-pause-context-previews';
import { useHomePullFullReload } from '@/hooks/use-home-pull-full-reload';
import { useHomeZenModeRouteProps } from '@/hooks/use-home-zen-route-props';
import { useHomeDashboardLayoutProps } from '@/hooks/use-home-dashboard-layout-props';
import type { HomeAppLayoutOutletContext } from '@/lib/home-app-layout-outlet';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { subscribed, loading: subLoading, monthlyRemaining, checkoutLoading, startCheckout, refresh } =
    useSubscription();
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
    subscribed,
    monthlyRemaining,
    hasOpenPause,
    loading,
  });

  const outletCtx = useOutletContext<HomeAppLayoutOutletContext>();
  const pauseReady = outletCtx?.pauseReady ?? false;
  const dismissPauseReady = outletCtx?.dismissPauseReady;
  useHomeOutletPauseReady(pauseReady, hasOpenPause, dismissPauseReady);
  useHomeHeroQuoteViewed(profileLoaded, user?.id);
  useHomePauseAudio(newPauseArrival, lastPauseInstanceId, clearNewPauseArrival);

  const { reflection: nightReflection, dismiss: dismissNight } = useNightReflection();

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
  const pauseContextHomePreview = useHomePauseContextPreviews(context);

  const [goalWhyHoldSummary, setGoalWhyHoldSummary] = useState<string | null>(null);

  const { order, collapsed, reorder, toggleCollapsed, resetLayout } = useWidgetLayout(HOME_WIDGET_DEFAULT_ORDER);
  const { visible: sectionVisible, setVisible, resetVisibility: resetSectionVisibility } = useHomeOptionalVisibility();

  const { visibleOrderedSectionIds, todaySectionIds, showJourneyStatTiles } = useHomeVisibleSections({
    order,
    sectionVisible,
    subscribed,
    hasNightReflection: !!nightReflection,
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
    subscribed,
    monthlyRemaining,
    checkoutLoading,
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
      nightReflection,
      dismissNight,
      subscribed,
      collapsed,
      toggleCollapsed,
    },
    visibleOrderedSectionIds,
  );

  const zenRouteProps = useHomeZenModeRouteProps({
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
    onStartCheckoutPro: pauseActions.startProCheckout,
  });

  const dashboardLayout = useHomeDashboardLayoutProps({
    pullHandlers,
    pullDistance,
    pullRefreshing,
    userId: user?.id,
    firstName,
    todaySectionIds,
    showJourneyStatTiles,
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
