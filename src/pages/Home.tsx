import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useHolzen } from '@/hooks/use-holzen';
import AuthLoading from '@/components/AuthLoading';
import { useSubscription } from '@/hooks/use-subscription';
import { Onboarding } from '@/components/Onboarding';
import { useWidgetLayout } from '@/components/HomeWidget';
import { HomePauseCardBody } from '@/components/home/HomePauseCardBody';
import { HomePinnedPauseInset } from '@/components/home/HomePinnedPauseInset';
import { HomeExpandChevronButton } from '@/components/home/HomeExpandChevronButton';
import { HomeDashboardLayout } from '@/components/home/HomeDashboardLayout';
import {
  useHomeOptionalVisibility,
  ALL_HOME_SECTION_IDS,
  JOURNEY_STAT_TILES_VISIBILITY_ID,
  isHomeSectionAlwaysVisibleInLayout,
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
import { lazy, Suspense, useCallback, useState, useMemo } from 'react';
import { useOutletContext, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { HolzenNumber } from '@/components/HolzenNumber';
import { holzenLog } from '@/lib/holzen-console';
import { trackEvent } from '@/lib/posthog';
import { parsePauseContextForHomePreview } from '@/lib/pause-context-home-preview';
import { type PauseSessionLocationState } from '@/lib/router-location-state';
import { getHomeCustomizeSectionDescription, getHomeCustomizeSectionTitle } from '@/lib/home-customize-section-copy';
import {
  renderHomeDashboardSection,
  type HomeDashboardSectionDeps,
} from '@/components/home/render-home-dashboard-section';
import { useNightReflection } from '@/components/NightReflectionCard';
import { SnoozeToolbarControl } from '@/components/SnoozeControl';

const ZenModeHomeLazy = lazy(() =>
  import('@/components/home/ZenModeHome').then((m) => ({ default: m.ZenModeHome })),
);

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
  const [goalWhyExpanded, setGoalWhyExpanded] = useState(false);
  const [goalWhyHoldSummary, setGoalWhyHoldSummary] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeDndEpoch, setCustomizeDndEpoch] = useState(0);

  const sectionDefaultOrder = useMemo(() => [...ALL_HOME_SECTION_IDS], []);
  const { order, collapsed, reorder, toggleCollapsed, resetLayout } = useWidgetLayout(sectionDefaultOrder);
  const { visible: sectionVisible, setVisible, resetVisibility: resetSectionVisibility } = useHomeOptionalVisibility();

  const visibleOrderedSectionIds = useMemo(
    () =>
      order.filter((id) => {
        if (isHomeSectionAlwaysVisibleInLayout(id)) return true;
        if (!sectionVisible[id]) return false;
        if (id === 'night' && (!subscribed || !nightReflection)) return false;
        return true;
      }),
    [order, sectionVisible, subscribed, nightReflection],
  );

  const todaySectionIds = useMemo(
    () => visibleOrderedSectionIds.filter((id) => id !== 'goal-why'),
    [visibleOrderedSectionIds],
  );

  const showJourneyStatTiles = !!sectionVisible[JOURNEY_STAT_TILES_VISIBILITY_ID];

  const handleSetSectionVisible = useCallback(
    (id: string, value: boolean) => {
      if (isHomeSectionAlwaysVisibleInLayout(id)) return;
      trackEvent('home.optional_widget_toggled', { widget_id: id, visible: value });
      setVisible(id, value);
      if (value && !order.includes(id)) {
        reorder([...order, id]);
      }
    },
    [setVisible, order, reorder],
  );

  const handleCustomizeResetAll = useCallback(() => {
    trackEvent('home.customize_reset_layout', {});
    resetLayout();
    resetSectionVisibility();
    setZenModePersist(false);
    setCustomizeDndEpoch((n) => n + 1);
  }, [resetLayout, resetSectionVisibility, setZenModePersist]);

  const homeCustomizeSectionTitle = useCallback((id: string) => getHomeCustomizeSectionTitle(t, id), [t]);

  const homeCustomizeSectionDescription = useCallback(
    (id: string) => getHomeCustomizeSectionDescription(t, id),
    [t],
  );

  const handleCustomizeOpenChange = useCallback((open: boolean) => {
    if (open) trackEvent('home.customize_opened', {});
    setCustomizeOpen(open);
  }, []);

  const toggleGoalWhyExpanded = useCallback(() => {
    setGoalWhyExpanded((prev) => {
      const next = !prev;
      trackEvent('home.goal_why_expand_toggled', { expanded: next });
      return next;
    });
  }, []);

  const marketExpandLabel = marketChartExpandBlocked
    ? t('home.market.chartExpandDisabled')
    : marketChartExpanded
      ? t('home.market.collapseDetails')
      : t('home.market.expandDetails');

  const marketHeaderRight = useMemo(
    () => (
      <HomeExpandChevronButton
        expanded={marketChartExpanded}
        onToggle={toggleMarketChartExpanded}
        disabled={marketChartExpandBlocked}
        ariaExpandedWhenEnabled={marketChartExpanded}
        ariaLabel={marketExpandLabel}
        title={marketExpandLabel}
      />
    ),
    [marketChartExpanded, marketChartExpandBlocked, toggleMarketChartExpanded, marketExpandLabel],
  );

  const goalWhyHeaderRight = useMemo(
    () => (
      <HomeExpandChevronButton
        expanded={goalWhyExpanded}
        onToggle={toggleGoalWhyExpanded}
        ariaExpandedWhenEnabled={goalWhyExpanded}
        ariaLabel={
          goalWhyExpanded ? t('home.goalWhy.collapseHoldDetails') : t('home.goalWhy.expandHoldDetails')
        }
      />
    ),
    [goalWhyExpanded, toggleGoalWhyExpanded, t],
  );

  const handleNeedAPause = useCallback(() => {
    const remaining = manualCooldownRemaining();
    if (remaining > 0) {
      holzenLog.home('Need a moment: ignored (cooldown)', { remainingMs: remaining });
      return;
    }
    holzenLog.home('Need a moment: invoking manualTrigger');
    manualTrigger();
  }, [manualCooldownRemaining, manualTrigger]);

  const handleDismiss = useCallback(() => {
    dismissMessage();
  }, [dismissMessage]);

  const handleNavigatePauseWithThis = useCallback(() => {
    if (!message) return;
    const navState: PauseSessionLocationState = {
      reflectionMessage: message,
      context,
      pauseInstanceId: lastPauseInstanceId ?? undefined,
      companions,
      companionPrefs,
      severity,
    };
    holzenLog.home('Navigate to /pause (pause with this message)', {
      pauseInstanceId: lastPauseInstanceId,
      severity,
      messageLen: message.length,
      hasContext: !!context,
      companionKeys: companions
        ? Object.entries(companions)
            .filter(([, v]) => v != null)
            .map(([k]) => k)
        : [],
    });
    navigate('/pause', { state: navState });
  }, [message, context, lastPauseInstanceId, companions, companionPrefs, severity, navigate]);

  const startProCheckout = useCallback(() => {
    startCheckout('pro');
  }, [startCheckout]);

  const handlePullRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  const { pullDistance, refreshing: pullRefreshing, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handlePullRefresh,
  });

  const pauseSectionHeaderRight = useMemo(() => {
    if (!subscriptionReady || !hasAccess) return undefined;
    return <SnoozeToolbarControl />;
  }, [subscriptionReady, hasAccess]);

  const pauseEmptyPinnedPreview = useMemo(
    () =>
      pinnedPausePreview ? (
        <HomePinnedPauseInset
          btc24h={pinnedContextHomePreview.btc24h}
          marketSentiment={pinnedContextHomePreview.marketSentiment}
          onUnpin={unpinPausePreview}
        />
      ) : null,
    [pinnedPausePreview, pinnedContextHomePreview.btc24h, pinnedContextHomePreview.marketSentiment, unpinPausePreview],
  );

  const marketFooter = useMemo(() => <HolzenNumber variant="compact" />, []);

  const showLimitUpsell = useMemo(
    () => subscriptionReady && !subscribed && monthlyRemaining === 0,
    [subscriptionReady, subscribed, monthlyRemaining],
  );

  const showPauseScheduling = useMemo(
    () => subscriptionReady && hasAccess && !message && !loading,
    [subscriptionReady, hasAccess, message, loading],
  );

  const pauseCardBody = useMemo(
    () => (
      <HomePauseCardBody
        subLoading={subLoading}
        hasAccess={hasAccess}
        subscribed={subscribed}
        monthlyRemaining={monthlyRemaining}
        checkoutLoading={checkoutLoading}
        onStartCheckoutPro={startProCheckout}
        message={message}
        contextPreview={pauseContextHomePreview}
        onPauseWithThis={handleNavigatePauseWithThis}
        loading={loading}
        error={error}
        btcData={btcData}
        onReflectionRetry={manualTrigger}
        pinnedPreview={pauseEmptyPinnedPreview}
        showPauseScheduling={showPauseScheduling}
        autoCooldownRemaining={autoCooldownRemaining}
        cooldownHours={cooldownHours}
        nextCronCheckIn={nextCronCheckIn}
        manualCooldownRemaining={manualCooldownRemaining}
        onNeedPause={handleNeedAPause}
      />
    ),
    [
      subLoading,
      hasAccess,
      subscribed,
      monthlyRemaining,
      checkoutLoading,
      startProCheckout,
      message,
      pauseContextHomePreview,
      handleNavigatePauseWithThis,
      loading,
      error,
      btcData,
      manualTrigger,
      pauseEmptyPinnedPreview,
      showPauseScheduling,
      autoCooldownRemaining,
      cooldownHours,
      nextCronCheckIn,
      manualCooldownRemaining,
      handleNeedAPause,
    ],
  );

  const sectionDeps: HomeDashboardSectionDeps = useMemo(
    () => ({
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
      pauseCardBody,
      pauseSectionHeaderRight,
      nightReflection,
      dismissNight,
      subscribed,
      collapsed,
      toggleCollapsed,
    }),
    [
      t,
      goalWhyHoldSummary,
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
      pauseCardBody,
      pauseSectionHeaderRight,
      nightReflection,
      dismissNight,
      subscribed,
      collapsed,
      toggleCollapsed,
    ],
  );

  const renderSection = useCallback(
    (sectionId: string) => renderHomeDashboardSection(sectionId, sectionDeps),
    [sectionDeps],
  );

  const goalWhyBlock = useMemo(() => {
    if (!visibleOrderedSectionIds.includes('goal-why')) return null;
    return renderHomeDashboardSection('goal-why', sectionDeps);
  }, [visibleOrderedSectionIds, sectionDeps]);

  if (!profileLoaded) {
    return <AuthLoading />;
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  if (zenMode) {
    return (
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-label={t('common.loading')} />
          </div>
        }
      >
        <ZenModeHomeLazy
          message={message}
          context={context}
          companions={companions}
          companionPrefs={companionPrefs}
          severity={severity}
          lastPauseInstanceId={lastPauseInstanceId}
          loading={loading}
          error={error}
          btcData={btcData}
          onDismiss={handleDismiss}
          onNeedPause={handleNeedAPause}
          onManualTrigger={manualTrigger}
          subscriptionReady={subscriptionReady}
          hasAccess={hasAccess}
          showLimitUpsell={showLimitUpsell}
          showPauseScheduling={showPauseScheduling}
          pinnedPreview={pauseEmptyPinnedPreview}
          autoCooldownRemaining={autoCooldownRemaining}
          cooldownHours={cooldownHours}
          nextCronCheckIn={nextCronCheckIn}
          manualCooldownRemaining={manualCooldownRemaining}
          checkoutLoading={checkoutLoading}
          onStartCheckoutPro={startProCheckout}
        />
      </Suspense>
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
      onOpenCustomize={() => handleCustomizeOpenChange(true)}
      customize={{
        open: customizeOpen,
        onOpenChange: handleCustomizeOpenChange,
        order,
        onReorder: reorder,
        visible: sectionVisible,
        onSetVisible: handleSetSectionVisible,
        sectionTitle: homeCustomizeSectionTitle,
        sectionDescription: homeCustomizeSectionDescription,
        zenMode,
        onZenModeChange: setZenModePersist,
        onResetAll: handleCustomizeResetAll,
        nightToggleDisabled: !subscribed,
        dndRemountKey: customizeDndEpoch,
      }}
      completedPauseCount={completedPauseCount}
    />
  );
};

export default Home;
