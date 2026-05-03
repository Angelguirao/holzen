import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useHolzen } from '@/hooks/use-holzen';
import AuthLoading from '@/components/AuthLoading';
import { useSubscription } from '@/hooks/use-subscription';
import { Onboarding } from '@/components/Onboarding';
import { useWidgetLayout } from '@/components/HomeWidget';
import { HomeDashboardLayout } from '@/components/home/HomeDashboardLayout';
import { HomeZenModeRoute } from '@/components/home/HomeZenModeRoute';
import {
  useHomeOptionalVisibility,
  HOME_WIDGET_DEFAULT_ORDER,
} from '@/hooks/use-home-optional-visibility';
import { useHomeCheckoutWelcomeToast } from '@/hooks/use-home-checkout-welcome-toast';
import { useHomeZenMode } from '@/hooks/use-home-zen-mode';
import { useHomePinnedPausePreview } from '@/hooks/use-home-pinned-pause-preview';
import { useHomeCompletedPauseCount } from '@/hooks/use-home-completed-pause-count';
import { useHomeOutletPauseReady } from '@/hooks/use-home-outlet-pause-ready';
import { useHomeDocumentTitle } from '@/hooks/use-home-document-title';
import { useHomeHeroQuoteViewed } from '@/hooks/use-home-hero-quote-viewed';
import { useHomePauseAudio } from '@/hooks/use-home-pause-audio';
import { useHomeMarketDisplayPreferences } from '@/hooks/use-home-market-display-preferences';
import { useCallback, useState, useMemo } from 'react';
import { useOutletContext, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { HolzenNumber } from '@/components/HolzenNumber';
import { parsePauseContextForHomePreview } from '@/lib/pause-context-home-preview';
import { useNightReflection } from '@/components/NightReflectionCard';
import { useHomeVisibleSections } from '@/hooks/use-home-visible-sections';
import { useHomeCustomizeBridge } from '@/hooks/use-home-customize-bridge';
import { useHomeMarketGoalHeaders } from '@/hooks/use-home-market-goal-headers';
import { useHomePauseActions } from '@/hooks/use-home-pause-actions';
import { useHomePauseCardProjection } from '@/hooks/use-home-pause-card-projection';
import { useHomeDashboardSectionDeps } from '@/hooks/use-home-dashboard-section-deps';
import { useHomeDashboardSectionRenderers } from '@/hooks/use-home-dashboard-section-renderers';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscribed, loading: subLoading, monthlyRemaining, checkoutLoading, startCheckout, refresh } =
    useSubscription();
  const subscriptionReady = !subLoading && (subscribed || monthlyRemaining !== undefined);
  const hasAccess = subscribed || ((monthlyRemaining ?? 0) > 0);
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

  const showLimitUpsell = subscriptionReady && !subscribed && monthlyRemaining === 0;
  const showPauseScheduling = subscriptionReady && hasAccess && !message && !loading;

  const outletCtx = useOutletContext<{ pauseReady?: boolean; dismissPauseReady?: () => void }>();
  const pauseReady = outletCtx?.pauseReady ?? false;
  const dismissPauseReady = outletCtx?.dismissPauseReady;
  useHomeOutletPauseReady(pauseReady, message, loading, refreshProfile, dismissPauseReady);
  useHomeHeroQuoteViewed(profileLoaded, user?.id);
  useHomePauseAudio(newPauseArrival, message, clearNewPauseArrival);

  const pauseContextHomePreview = useMemo(() => parsePauseContextForHomePreview(context), [context]);

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
  const { zenMode, setZenModePersist } = useHomeZenMode(location.pathname);
  const { pinnedPausePreview, unpinPausePreview } = useHomePinnedPausePreview(user);
  const completedPauseCount = useHomeCompletedPauseCount(user);
  const pinnedContextHomePreview = useMemo(
    () => parsePauseContextForHomePreview(pinnedPausePreview?.context ?? null),
    [pinnedPausePreview?.context],
  );
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
    companions,
    companionPrefs,
    severity,
    navigate,
    dismissMessage,
    manualTrigger,
    manualCooldownRemaining,
    startCheckout,
  });

  const pauseProjection = useHomePauseCardProjection({
    subscriptionReady,
    hasAccess,
    subLoading,
    subscribed,
    monthlyRemaining,
    checkoutLoading,
    message,
    pauseContextHomePreview,
    loading,
    error,
    btcData,
    pinnedPausePreview,
    pinnedPreviewFields: pinnedContextHomePreview,
    unpinPausePreview,
    showPauseScheduling,
    autoCooldownRemaining,
    cooldownHours,
    nextCronCheckIn,
    manualCooldownRemaining,
    manualTrigger,
    onNavigatePauseWithThis: pauseActions.handleNavigatePauseWithThis,
    onNeedPause: pauseActions.handleNeedAPause,
    onStartCheckoutPro: pauseActions.startProCheckout,
  });

  const handlePullRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  const { pullDistance, refreshing: pullRefreshing, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handlePullRefresh,
  });

  const marketFooter = useMemo(() => <HolzenNumber variant="compact" />, []);

  const sectionDeps = useHomeDashboardSectionDeps({
    t,
    goalWhyHoldSummary,
    setGoalWhyHoldSummary,
    goalWhyHeaderRight,
    goalWhyExpanded,
    error,
    marketHeaderRight,
    marketFooter,
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
  });

  const { renderSection, goalWhyBlock } = useHomeDashboardSectionRenderers(sectionDeps, visibleOrderedSectionIds);

  if (!profileLoaded) {
    return <AuthLoading />;
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  if (zenMode) {
    return (
      <HomeZenModeRoute
        message={message}
        context={context}
        companions={companions}
        companionPrefs={companionPrefs}
        severity={severity}
        lastPauseInstanceId={lastPauseInstanceId}
        loading={loading}
        error={error}
        btcData={btcData}
        onDismiss={pauseActions.handleDismiss}
        onNeedPause={pauseActions.handleNeedAPause}
        onManualTrigger={manualTrigger}
        subscriptionReady={subscriptionReady}
        hasAccess={hasAccess}
        showLimitUpsell={showLimitUpsell}
        showPauseScheduling={showPauseScheduling}
        pinnedPreview={pauseProjection.pauseEmptyPinnedPreview}
        autoCooldownRemaining={autoCooldownRemaining}
        cooldownHours={cooldownHours}
        nextCronCheckIn={nextCronCheckIn}
        manualCooldownRemaining={manualCooldownRemaining}
        checkoutLoading={checkoutLoading}
        onStartCheckoutPro={pauseActions.startProCheckout}
      />
    );
  }

  return (
    <HomeDashboardLayout
      pullHandlers={pullHandlers}
      pullDistance={pullDistance}
      pullRefreshing={pullRefreshing}
      userId={user?.id}
      firstName={firstName}
      todaySectionIds={todaySectionIds}
      showJourneyStatTiles={showJourneyStatTiles}
      goalWhyBlock={goalWhyBlock}
      renderSection={renderSection}
      onOpenCustomize={onOpenCustomize}
      customize={customizeSheet}
      completedPauseCount={completedPauseCount}
    />
  );
};

export default Home;
