import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useHolzen } from '@/hooks/use-holzen';
import { TestimonialRequest } from '@/components/TestimonialRequest';
import AuthLoading from '@/components/AuthLoading';
import { useSubscription } from '@/hooks/use-subscription';
import { BtcStatus } from '@/components/BtcStatus';
import { NightReflectionCard, useNightReflection } from '@/components/NightReflectionCard';
import { HolzenNumber } from '@/components/HolzenNumber';
import { Onboarding } from '@/components/Onboarding';
import { HomeGoalWhyCard } from '@/components/home/HomeGoalWhyCard';
import { useWidgetLayout } from '@/components/HomeWidget';
import { HomeSectionCard } from '@/components/home/HomeSectionCard';
import { HomeStatTiles } from '@/components/home/HomeStatTiles';
import { HomeHeroQuote } from '@/components/home/HomeHeroQuote';
import { HomeCustomizeSheet } from '@/components/home/HomeCustomizeSheet';
import { ZenModeHome } from '@/components/home/ZenModeHome';
import { HomePauseCardBody } from '@/components/home/HomePauseCardBody';
import { HomePinnedPauseInset } from '@/components/home/HomePinnedPauseInset';
import { HomeExpandChevronButton } from '@/components/home/HomeExpandChevronButton';
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
import { useCallback, useState, useMemo, type ReactNode } from 'react';
import { useOutletContext, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { RefreshCw } from 'lucide-react';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';
import { InstallHolzenCard } from '@/components/InstallHolzenCard';
import { HomeQuickCapture } from '@/components/home/HomeQuickCapture';
import { SnoozeToolbarControl } from '@/components/SnoozeControl';
import { holzenLog } from '@/lib/holzen-console';
import { trackEvent } from '@/lib/posthog';
import { parsePauseContextForHomePreview } from '@/lib/pause-context-home-preview';
import { type PauseSessionLocationState } from '@/lib/router-location-state';
import { getHomeCustomizeSectionDescription, getHomeCustomizeSectionTitle } from '@/lib/home-customize-section-copy';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscribed, loading: subLoading, monthlyRemaining, checkoutLoading, startCheckout, refresh } = useSubscription();
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

  /** Tail inside "Today" — `goal-why` is pinned first in layout order and rendered above Today. */
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

  if (!profileLoaded) {
    return <AuthLoading />;
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const showLimitUpsell = subscriptionReady && !subscribed && monthlyRemaining === 0;
  /** Hide server scheduling row while a reflection is showing or generating — keeps focus on the pause. */
  const showPauseScheduling = subscriptionReady && hasAccess && !message && !loading;

  if (zenMode) {
    return (
      <ZenModeHome
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
    );
  }

  const pauseCardBody = (
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
  );

  const marketFooter = <HolzenNumber variant="compact" />;

  const renderHomeSection = (sectionId: string): ReactNode => {
    switch (sectionId) {
      case 'goal-why':
        return (
          <HomeSectionCard
            className="rounded-lg"
            title={t('home.widget.whyHoldTitle')}
            headerSubtitle={goalWhyHoldSummary ?? undefined}
            headerRight={goalWhyHeaderRight}
          >
            <HomeGoalWhyCard
              currentPrice={btcData?.currentPrice}
              detailsExpanded={goalWhyExpanded}
              onHoldGoalSummaryChange={setGoalWhyHoldSummary}
            />
          </HomeSectionCard>
        );

      case 'market':
        return (
          <HomeSectionCard
            title={t('home.widget.market')}
            headerRight={error ? undefined : marketHeaderRight}
            footer={marketFooter}
          >
            <BtcStatus
              data={btcData}
              error={error}
              hidden={priceHidden}
              onToggleHidden={togglePriceHidden}
              currency={currency}
              coinId={trackedAssetId}
              btcMode={unitBasisModeSupported && btcMode}
              onToggleBtcMode={unitBasisModeSupported ? toggleBtcMode : undefined}
              chartExpanded={marketChartExpanded}
              onToggleChartExpanded={toggleMarketChartExpanded}
              chartChevronInPriceRow={false}
            />
          </HomeSectionCard>
        );

      case 'your-pause':
        return (
          <HomeSectionCard title={t('home.widget.yourPause')} headerRight={pauseSectionHeaderRight}>
            {pauseCardBody}
          </HomeSectionCard>
        );

      case 'quick-capture':
        return (
          <HomeSectionCard
            title={t('home.widget.quickCapture')}
            collapsible
            collapsed={!!collapsed['quick-capture']}
            onToggleCollapse={() => toggleCollapsed('quick-capture')}
          >
            <HomeQuickCapture />
          </HomeSectionCard>
        );

      case 'night':
        if (!nightReflection || !subscribed) return null;
        return (
          <HomeSectionCard
            title={t('home.widget.evening')}
            collapsible
            collapsed={!!collapsed.night}
            onToggleCollapse={() => toggleCollapsed('night')}
          >
            <NightReflectionCard reflection={nightReflection} onDismiss={dismissNight} />
          </HomeSectionCard>
        );

      default:
        return null;
    }
  };

  const goalWhyBlock = visibleOrderedSectionIds.includes('goal-why') ? renderHomeSection('goal-why') : null;

  return (
    <div {...pullHandlers} className="space-y-6">
      <HomeHeroQuote userId={user?.id} firstName={firstName} />

      <InstallHolzenCard />

      {(pullDistance > 0 || pullRefreshing) && (
        <div
          className="flex items-center justify-center transition-all overflow-hidden"
          style={{ height: pullRefreshing ? 32 : pullDistance * 0.4 }}
        >
          <RefreshCw
            className={`h-4 w-4 text-muted-foreground/50 transition-transform ${
              pullRefreshing ? 'animate-spin' : ''
            }`}
            style={{ transform: pullRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}

      <div className="space-y-4">
        {todaySectionIds.length === 0 ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleCustomizeOpenChange(true)}
              className="text-sm font-medium text-nox-text-link underline underline-offset-4 transition-colors hover:text-nox-text-link/80"
            >
              {t('home.customize')}
            </button>
          </div>
        ) : null}
        {goalWhyBlock ? <div key="goal-why">{goalWhyBlock}</div> : null}
        {todaySectionIds.length > 0 ? (
          <section aria-labelledby="home-today-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="home-today-heading" className="text-base font-medium text-foreground">
                {t('home.today')}
              </h2>
              <button
                type="button"
                onClick={() => handleCustomizeOpenChange(true)}
                className="shrink-0 text-sm font-medium text-nox-text-link underline underline-offset-4 transition-colors hover:text-nox-text-link/80"
              >
                {t('home.customize')}
              </button>
            </div>
            <div className="space-y-4">
              {todaySectionIds.map((sectionId) => {
                if (sectionId === JOURNEY_STAT_TILES_VISIBILITY_ID) {
                  if (!showJourneyStatTiles) return null;
                  return (
                    <div key={sectionId}>
                      <HomeStatTiles />
                    </div>
                  );
                }
                const node = renderHomeSection(sectionId);
                if (node == null) return null;
                return <div key={sectionId}>{node}</div>;
              })}
            </div>
          </section>
        ) : null}
      </div>

      <HomeCustomizeSheet
        open={customizeOpen}
        onOpenChange={handleCustomizeOpenChange}
        order={order}
        onReorder={reorder}
        visible={sectionVisible}
        onSetVisible={handleSetSectionVisible}
        sectionTitle={homeCustomizeSectionTitle}
        sectionDescription={homeCustomizeSectionDescription}
        zenMode={zenMode}
        onZenModeChange={setZenModePersist}
        onResetAll={handleCustomizeResetAll}
        nightToggleDisabled={!subscribed}
        dndRemountKey={customizeDndEpoch}
      />

      <TestimonialRequest completedPauseCount={completedPauseCount} />
    </div>
  );
};

export default Home;
