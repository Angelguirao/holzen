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
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionSkeleton } from '@/components/SubscriptionSkeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import { useWidgetLayout } from '@/components/HomeWidget';
import { HomeSectionCard } from '@/components/home/HomeSectionCard';
import { HomeStatTiles } from '@/components/home/HomeStatTiles';
import { HomeHeroQuote } from '@/components/home/HomeHeroQuote';
import { HomeCustomizeSheet } from '@/components/home/HomeCustomizeSheet';
import { ZenModeHome } from '@/components/home/ZenModeHome';
import { HomePauseBlockingErrorPanel } from '@/components/home/HomePauseBlockingErrorPanel';
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
import { useCallback, useEffect, useState, useMemo, useRef, type ReactNode } from 'react';
import { useOutletContext, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { ChevronDown, Loader2, Pin, Sparkles, RefreshCw } from 'lucide-react';
import { HomePauseEmptyFlow } from '@/components/home/HomePauseEmptyFlow';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';
import { BulkHoldCard } from '@/components/BulkHoldCard';
import { InstallHolzenCard } from '@/components/InstallHolzenCard';
import { HomeQuickCapture } from '@/components/home/HomeQuickCapture';
import { SnoozeToolbarControl } from '@/components/SnoozeControl';
import { playNotificationTone, prefetchNotificationTone } from '@/lib/notification-tone';
import { holzenLog } from '@/lib/holzen-console';
import { trackEvent } from '@/lib/posthog';
import { heroQuoteIndexForDay, utcYmd } from '@/lib/home-hero-quote';
import { parsePauseContextForHomePreview } from '@/lib/pause-context-home-preview';
import { type PauseSessionLocationState } from '@/lib/router-location-state';
import { shouldSurfacePauseWidgetError } from '@/lib/home-pause-widget-error';

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

  const pauseContextHomePreview = useMemo(() => parsePauseContextForHomePreview(context), [context]);

  // Consume auto-trigger context from AppLayout
  const outletCtx = useOutletContext<{ pauseReady?: boolean; dismissPauseReady?: () => void }>();
  const pauseReady = outletCtx?.pauseReady ?? false;
  const dismissPauseReady = outletCtx?.dismissPauseReady;

  // When realtime detects a server-side trigger, refresh profile to get new message
  useEffect(() => {
    if (pauseReady && !message && !loading) {
      refreshProfile();
      dismissPauseReady?.();
    }
  }, [pauseReady, message, loading, refreshProfile, dismissPauseReady]);

  const { reflection: nightReflection, dismiss: dismissNight } = useNightReflection();

  const [priceHidden, setPriceHidden] = useState(() => {
    try {
      return localStorage.getItem('holzen_hide_price') === 'true';
    } catch {
      return false;
    }
  });
  const [btcMode, setBtcMode] = useState(() => {
    try {
      return localStorage.getItem('holzen_btc_mode') === 'true';
    } catch {
      return false;
    }
  });
  const unitBasisModeSupported = trackedAssetId === 'bitcoin';
  const { zenMode, setZenModePersist } = useHomeZenMode(location.pathname);
  const { pinnedPausePreview, unpinPausePreview } = useHomePinnedPausePreview(user);
  const completedPauseCount = useHomeCompletedPauseCount(user);
  const pinnedContextHomePreview = useMemo(
    () => parsePauseContextForHomePreview(pinnedPausePreview?.context ?? null),
    [pinnedPausePreview?.context],
  );
  const [marketChartExpanded, setMarketChartExpanded] = useState(false);
  const [goalWhyExpanded, setGoalWhyExpanded] = useState(false);
  const [goalWhyHoldSummary, setGoalWhyHoldSummary] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeDndEpoch, setCustomizeDndEpoch] = useState(0);
  const heroQuoteViewTracked = useRef(false);

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

  const homeCustomizeSectionTitle = useCallback(
    (id: string) => {
      const titles: Record<string, string> = {
        'goal-why': t('home.widget.whyHoldTitle'),
        market: t('home.customizeSheet.sections.market.title'),
        'your-pause': t('home.customizeSheet.sections.yourPause.title'),
        'quick-capture': t('home.customizeSheet.sections.quickCapture.title'),
        night: t('home.customizeSheet.sections.night.title'),
        [JOURNEY_STAT_TILES_VISIBILITY_ID]: t('home.customizeSheet.sections.journeyPulse.title'),
      };
      return titles[id] ?? id;
    },
    [t],
  );

  const homeCustomizeSectionDescription = useCallback(
    (id: string) => {
      const descs: Record<string, string> = {
        'goal-why': t('home.customizeSheet.sections.goalWhy.desc'),
        market: t('home.customizeSheet.sections.market.desc'),
        'your-pause': t('home.customizeSheet.sections.yourPause.desc'),
        'quick-capture': t('home.customizeSheet.sections.quickCapture.desc'),
        night: t('home.customizeSheet.sections.night.desc'),
        [JOURNEY_STAT_TILES_VISIBILITY_ID]: t('home.customizeSheet.sections.journeyPulse.desc'),
      };
      return descs[id] ?? '';
    },
    [t],
  );

  const handleCustomizeOpenChange = useCallback((open: boolean) => {
    if (open) trackEvent('home.customize_opened', {});
    setCustomizeOpen(open);
  }, []);

  const toggleMarketChartExpanded = useCallback(() => {
    setMarketChartExpanded((prev) => {
      const next = !prev;
      trackEvent('home.market_chart_expand_toggled', { expanded: next });
      return next;
    });
  }, []);

  const toggleGoalWhyExpanded = useCallback(() => {
    setGoalWhyExpanded((prev) => {
      const next = !prev;
      trackEvent('home.goal_why_expand_toggled', { expanded: next });
      return next;
    });
  }, []);

  const marketChartExpandBlocked = btcMode || priceHidden;

  useEffect(() => {
    if (btcMode || priceHidden) {
      setMarketChartExpanded(false);
    }
  }, [btcMode, priceHidden]);

  const marketHeaderRight = useMemo(
    () => (
      <button
        type="button"
        onClick={toggleMarketChartExpanded}
        disabled={marketChartExpandBlocked}
        className={cn(homeInWidget.iconBtn, 'disabled:cursor-not-allowed disabled:opacity-40')}
        aria-expanded={marketChartExpandBlocked ? false : marketChartExpanded}
        aria-label={
          marketChartExpandBlocked
            ? t('home.market.chartExpandDisabled')
            : marketChartExpanded
              ? t('home.market.collapseDetails')
              : t('home.market.expandDetails')
        }
        title={
          marketChartExpandBlocked
            ? t('home.market.chartExpandDisabled')
            : marketChartExpanded
              ? t('home.market.collapseDetails')
              : t('home.market.expandDetails')
        }
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 text-secondary-foreground transition-transform duration-200',
            !marketChartExpanded && '-rotate-90',
          )}
          aria-hidden
        />
      </button>
    ),
    [marketChartExpanded, marketChartExpandBlocked, toggleMarketChartExpanded, t],
  );

  const goalWhyHeaderRight = useMemo(
    () => (
      <button
        type="button"
        onClick={toggleGoalWhyExpanded}
        className={homeInWidget.iconBtn}
        aria-expanded={goalWhyExpanded}
        aria-label={
          goalWhyExpanded ? t('home.goalWhy.collapseHoldDetails') : t('home.goalWhy.expandHoldDetails')
        }
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 text-secondary-foreground transition-transform duration-200',
            !goalWhyExpanded && '-rotate-90',
          )}
          aria-hidden
        />
      </button>
    ),
    [goalWhyExpanded, toggleGoalWhyExpanded, t],
  );

  useEffect(() => {
    if (!profileLoaded || heroQuoteViewTracked.current) return;
    heroQuoteViewTracked.current = true;
    const ymd = utcYmd();
    trackEvent('home.hero_quote_viewed', {
      quote_index: heroQuoteIndexForDay(user?.id, ymd),
      utc_ymd: ymd,
    });
  }, [profileLoaded, user?.id]);

  const togglePriceHidden = useCallback(() => {
    setPriceHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('holzen_hide_price', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleBtcMode = useCallback(() => {
    setBtcMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('holzen_btc_mode', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

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

  const lastToneMsgRef = useRef<string | null>(null);
  useEffect(() => {
    if (newPauseArrival && message) {
      // Only play tone once per unique message to prevent double-play
      if (message !== lastToneMsgRef.current) {
        lastToneMsgRef.current = message;
        let soundEnabled = true;
        try {
          soundEnabled = localStorage.getItem('holzen_sound_enabled') !== 'false';
        } catch {
          soundEnabled = true;
        }
        if (soundEnabled) {
          playNotificationTone();
        }
      }
      clearNewPauseArrival();
    }
  }, [newPauseArrival, message, clearNewPauseArrival]);

  useEffect(() => {
    prefetchNotificationTone();
  }, []);

  useEffect(() => {
    document.title = 'Holzen — Home';
    return () => { document.title = 'Holzen — Pause before you act'; };
  }, []);

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
        <div className={cn(homeInWidget.inset, 'space-y-3')}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Pin className="h-3.5 w-3.5 shrink-0" />
              <span className={homeInWidget.kicker}>{t('common.pinned')}</span>
            </div>
            <button
              type="button"
              onClick={unpinPausePreview}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('common.unpin')}
            </button>
          </div>
          {(pinnedContextHomePreview.btc24h || pinnedContextHomePreview.marketSentiment) ? (
            <div className={cn(homeInWidget.meta, 'space-y-1')}>
              {pinnedContextHomePreview.btc24h ? (
                <p className="leading-snug">{pinnedContextHomePreview.btc24h}</p>
              ) : null}
              {pinnedContextHomePreview.marketSentiment ? (
                <p className="leading-snug">{pinnedContextHomePreview.marketSentiment}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null,
    [
      pinnedPausePreview,
      pinnedContextHomePreview.btc24h,
      pinnedContextHomePreview.marketSentiment,
      t,
      unpinPausePreview,
    ],
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
        onStartCheckoutPro={() => startCheckout('pro')}
      />
    );
  }

  const pauseCardBody = (
    <div className="space-y-4">
      <BulkHoldCard />

      {!subLoading && !hasAccess ? (
        <div className="space-y-3">
          <p className={homeInWidget.bodyMuted}>{t('home.subscription.monthlyLimitReached')}</p>
          <p className={`${homeInWidget.meta} mb-[16px]`}>{t('home.subscription.upgradeToPro')}</p>
          <LoadingButton
            onClick={() => startCheckout('pro')}
            loading={checkoutLoading}
            loadingText={t('home.subscription.openingCheckout')}
            className="w-full text-sm font-medium mt-4"
          >
            {t('pro.upgradeCta')}
          </LoadingButton>
        </div>
      ) : subLoading ? (
        <SubscriptionSkeleton variant="inline" />
      ) : (
        <>
          {!subscribed && monthlyRemaining !== undefined && monthlyRemaining > 0 && (
            <p className={homeInWidget.meta}>{t('home.subscription.freeRemaining', { count: monthlyRemaining })}</p>
          )}

          {message ? (
            <div className="space-y-4">
              {(pauseContextHomePreview.btc24h || pauseContextHomePreview.marketSentiment) ? (
                <div className={cn(homeInWidget.meta, 'min-w-0 space-y-1')}>
                  {pauseContextHomePreview.btc24h ? (
                    <p className="leading-snug">{pauseContextHomePreview.btc24h}</p>
                  ) : null}
                  {pauseContextHomePreview.marketSentiment ? (
                    <p className="leading-snug">{pauseContextHomePreview.marketSentiment}</p>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleNavigatePauseWithThis}
                className={cn(homeInWidget.ctaPrimary, 'bg-foreground text-background hover:bg-foreground/90')}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-background" />
                {t('onboarding.pauseWithThis')}
              </button>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="space-y-4">
                  <div className={homeInWidget.loadingRow}>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    <p className={homeInWidget.bodyMuted}>{t('home.generatingReflection')}</p>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : error && shouldSurfacePauseWidgetError(error, btcData) ? (
                <HomePauseBlockingErrorPanel error={error} onTryAgain={manualTrigger} />
              ) : (
                <HomePauseEmptyFlow
                  pinnedPreview={pauseEmptyPinnedPreview}
                  showPauseScheduling={showPauseScheduling}
                  autoCooldownRemaining={autoCooldownRemaining}
                  cooldownHours={cooldownHours}
                  nextCronCheckIn={nextCronCheckIn}
                  onNeedPause={handleNeedAPause}
                  manualCooldownRemaining={manualCooldownRemaining}
                  pauseLoading={loading}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
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
