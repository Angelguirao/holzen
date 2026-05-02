import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useHolzen } from '@/hooks/use-holzen';
import { isPausePersistError } from '@/lib/reflection-persist-error';
import { TestimonialRequest } from '@/components/TestimonialRequest';
import AuthLoading from '@/components/AuthLoading';
import { useSubscription } from '@/hooks/use-subscription';
import { BtcStatus } from '@/components/BtcStatus';
import { NightReflectionCard, useNightReflection } from '@/components/NightReflectionCard';
import { ReflectionMessage } from '@/components/ReflectionMessage';
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
import {
  useHomeOptionalVisibility,
  ALL_HOME_SECTION_IDS,
  JOURNEY_STAT_TILES_VISIBILITY_ID,
  isHomeSectionAlwaysVisibleInLayout,
} from '@/hooks/use-home-optional-visibility';
import { useCallback, useEffect, useState, useMemo, useRef, type ReactNode } from 'react';
import { useOutletContext, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { AlertCircle, ChevronDown, Loader2, Pin, Sparkles, RefreshCw } from 'lucide-react';
import { AutoCooldownIndicator, NeedAMomentButton } from '@/components/home/HomePauseChrome';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';
import { BulkHoldCard } from '@/components/BulkHoldCard';
import { InstallHolzenCard } from '@/components/InstallHolzenCard';
import { HomeQuickCapture } from '@/components/home/HomeQuickCapture';
import { SnoozeToolbarControl } from '@/components/SnoozeControl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { playNotificationTone, prefetchNotificationTone } from '@/lib/notification-tone';
import { holzenLog } from '@/lib/holzen-console';
import { trackEvent } from '@/lib/posthog';
import { heroQuoteIndexForDay, utcYmd } from '@/lib/home-hero-quote';
import { parsePauseContextForHomePreview } from '@/lib/pause-context-home-preview';
import { type PauseSessionLocationState } from '@/lib/router-location-state';
import { buildHomeRenderableSegments } from '@/lib/home-renderable-segments';

interface PinnedPausePreview {
  id: string;
  message: string;
  context: string | null;
  haiku: string | null;
  grounding_title: string | null;
  grounding_body: string | null;
}

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscribed, loading: subLoading, monthlyRemaining, checkoutLoading, startCheckout, refresh } = useSubscription();
  const subscriptionReady = !subLoading && (subscribed || monthlyRemaining !== undefined);
  const hasAccess = subscribed || ((monthlyRemaining ?? 0) > 0);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('subscribed') === 'true') {
      refresh();
      toast.success(
        t('pro.welcomeToast', { defaultValue: '🎉 Welcome to Pro! All features are now unlocked.' }),
      );
    }
  }, [searchParams, refresh, t]);

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

  const [priceHidden, setPriceHidden] = useState(() => localStorage.getItem('holzen_hide_price') === 'true');
  const [btcMode, setBtcMode] = useState(() => localStorage.getItem('holzen_btc_mode') === 'true');
  // One-time reset: Zen Mode previously defaulted on for some users via a stale
  // localStorage flag, which silently replaced the full Home (widgets) with a
  // minimal ReflectionMessage view that looked like "the end of a pause flow."
  // Clear the flag once per browser; users can re-enable Zen Mode explicitly
  // from Settings → Appearance.
  const [zenMode, setZenModeState] = useState(() => {
    const RESET_KEY = 'holzen_zen_mode_reset_v1';
    if (typeof window !== 'undefined' && !localStorage.getItem(RESET_KEY)) {
      localStorage.removeItem('holzen_zen_mode');
      localStorage.setItem(RESET_KEY, '1');
      return false;
    }
    return localStorage.getItem('holzen_zen_mode') === 'true';
  });

  const setZenModePersist = useCallback((zen: boolean) => {
    setZenModeState(zen);
    localStorage.setItem('holzen_zen_mode', String(zen));
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'holzen_zen_mode' && e.newValue != null) {
        setZenModeState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (location.pathname === '/') {
      setZenModeState(localStorage.getItem('holzen_zen_mode') === 'true');
    }
  }, [location.pathname]);
  const [pinnedPausePreview, setPinnedPausePreview] = useState<PinnedPausePreview | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [completedPauseCount, setCompletedPauseCount] = useState(0);
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

  const homeSegments = useMemo(
    () => buildHomeRenderableSegments(visibleOrderedSectionIds),
    [visibleOrderedSectionIds],
  );

  const hasTodaySegment = useMemo(
    () => homeSegments.some((s) => s.type === 'todayBlock'),
    [homeSegments],
  );

  const firstTodaySegmentIndex = useMemo(
    () => homeSegments.findIndex((s) => s.type === 'todayBlock'),
    [homeSegments],
  );

  const showJourneyStatTiles = !!sectionVisible[JOURNEY_STAT_TILES_VISIBILITY_ID];

  const showHomeStatTilesAtTopOfToday = useCallback(
    (todayIds: readonly string[]) =>
      todayIds.length > 0 &&
      (showJourneyStatTiles || todayIds.includes('market') || todayIds.includes('your-pause')),
    [showJourneyStatTiles],
  );

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

  const handleZenModeFromCustomize = useCallback(
    (zen: boolean) => {
      setZenModePersist(zen);
    },
    [setZenModePersist],
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

  const marketHeaderRight = useMemo(
    () => (
      <button
        type="button"
        onClick={toggleMarketChartExpanded}
        className={homeInWidget.iconBtn}
        aria-expanded={marketChartExpanded}
        aria-label={
          marketChartExpanded ? t('home.market.collapseDetails') : t('home.market.expandDetails')
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
    [marketChartExpanded, toggleMarketChartExpanded, t],
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

  // Load pinned pause (legacy key name retained for localStorage back-compat).
  useEffect(() => {
    if (!user) return;
    const pinnedId = localStorage.getItem('holzen_pinned_reflection');
    if (!pinnedId) return;
    let cancelled = false;
    void (async () => {
      const { data: inst } = await supabase
        .from('pause_instances' as never)
        .select('id, context_snapshot')
        .eq('id', pinnedId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!inst) {
        localStorage.removeItem('holzen_pinned_reflection');
        return;
      }
      const { data: artifacts } = await supabase
        .from('pause_ai_artifacts' as never)
        .select('kind, content')
        .eq('pause_instance_id', pinnedId);
      if (cancelled) return;
      let message = '';
      let haiku: string | null = null;
      let groundingTitle: string | null = null;
      let groundingBody: string | null = null;
      for (const a of ((artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>)) {
        if (a.kind === 'reflection_text' && typeof a.content?.message === 'string') {
          message = a.content.message as string;
        } else if (a.kind === 'haiku' && typeof a.content?.haiku === 'string') {
          haiku = a.content.haiku as string;
        } else if (a.kind === 'ground_nudge') {
          if (typeof a.content?.title === 'string') groundingTitle = a.content.title as string;
          if (typeof a.content?.body === 'string') groundingBody = a.content.body as string;
        }
      }
      const ctxSnap = ((inst as { context_snapshot: Record<string, unknown> | null }).context_snapshot ?? {}) as Record<string, unknown>;
      const context = typeof ctxSnap.context_text === 'string' ? (ctxSnap.context_text as string) : null;
      setPinnedPausePreview({
        id: pinnedId,
        message,
        context,
        haiku,
        grounding_title: groundingTitle,
        grounding_body: groundingBody,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch completed-pause count for testimonial prompt.
  useEffect(() => {
    if (!user) return;
    supabase
      .from('pause_instances' as never)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('state', 'completed')
      .then(({ count }: { count: number | null }) => {
        if (count != null) setCompletedPauseCount(count);
      });
  }, [user]);

  const togglePriceHidden = useCallback(() => {
    setPriceHidden(prev => {
      const next = !prev;
      localStorage.setItem('holzen_hide_price', String(next));
      return next;
    });
  }, []);

  const toggleBtcMode = useCallback(() => {
    setBtcMode(prev => {
      const next = !prev;
      localStorage.setItem('holzen_btc_mode', String(next));
      return next;
    });
  }, []);

  const handleNeedAPause = () => {
    const remaining = manualCooldownRemaining();
    if (remaining > 0) {
      holzenLog.home('Need a moment: ignored (cooldown)', { remainingMs: remaining });
      return;
    }
    holzenLog.home('Need a moment: invoking manualTrigger');
    manualTrigger();
  };

  const handleDismiss = () => {
    dismissMessage();
  };

  const lastToneMsgRef = useRef<string | null>(null);
  useEffect(() => {
    if (newPauseArrival && message) {
      // Only play tone once per unique message to prevent double-play
      if (message !== lastToneMsgRef.current) {
        lastToneMsgRef.current = message;
        const soundEnabled = localStorage.getItem('holzen_sound_enabled') !== 'false';
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

  const unpinPausePreview = useCallback(() => {
    localStorage.removeItem('holzen_pinned_reflection');
    setPinnedPausePreview(null);
  }, []);

  const handlePullRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  const { pullDistance, refreshing: pullRefreshing, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handlePullRefresh,
  });

  const [pauseHasReflectStep, setPauseHasReflectStep] = useState(false);

  useEffect(() => {
    if (!user || !lastPauseInstanceId) {
      setPauseHasReflectStep(false);
      return;
    }
    let cancelled = false;

    const refetchReflectStep = async () => {
      const { data } = await supabase
        .from('pause_step_events' as never)
        .select('id')
        .eq('pause_instance_id', lastPauseInstanceId)
        .eq('step_type', 'reflection_step')
        .limit(1)
        .maybeSingle();
      if (!cancelled) setPauseHasReflectStep(!!data);
    };

    void refetchReflectStep();

    const channel = supabase
      .channel(`home-pause-step-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pause_step_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { pause_instance_id?: string; step_type?: string };
          if (row.pause_instance_id === lastPauseInstanceId && row.step_type === 'reflection_step') {
            setPauseHasReflectStep(true);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [user, lastPauseInstanceId, location.pathname]);

  const pauseSectionHeaderRight = useMemo(() => {
    if (!subscriptionReady || !hasAccess) return undefined;
    const showRegenerate = Boolean(message && lastPauseInstanceId && pauseHasReflectStep);

    return (
      <div className="flex items-center gap-0.5">
        <SnoozeToolbarControl />
        {showRegenerate ? (
          <button
            type="button"
            onClick={() => {
              const remaining = manualCooldownRemaining();
              if (remaining > 0) {
                holzenLog.home('Regenerate reflection: ignored (cooldown)', { remainingMs: remaining });
                return;
              }
              holzenLog.home('Regenerate reflection from Home header: manualTrigger');
              void manualTrigger();
            }}
            disabled={loading}
            className={homeInWidget.iconBtn}
            aria-label={t('home.regenerateReflectionAria')}
            title={t('home.regenerateReflectionTitle', { defaultValue: 'Generate a fresh take for this moment' })}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-secondary-foreground" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4 shrink-0 text-secondary-foreground" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    );
  }, [
    subscriptionReady,
    hasAccess,
    message,
    lastPauseInstanceId,
    pauseHasReflectStep,
    loading,
    manualCooldownRemaining,
    manualTrigger,
    t,
  ]);

  if (!profileLoaded) {
    return <AuthLoading />;
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const showLimitUpsell = subscriptionReady && !subscribed && monthlyRemaining === 0;
  /** Hide server scheduling row while a reflection is showing or generating — keeps focus on the pause. */
  const showPauseScheduling = subscriptionReady && hasAccess && !message && !loading;

  // Zen mode — unchanged
  if (zenMode) {
    const zenTransition = { duration: 0.8, ease: "easeOut" as const };
    const zenVariants = prefersReducedMotion
      ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
      : {
          hidden: { opacity: 0, y: 12 },
          visible: { opacity: 1, y: 0, transition: zenTransition },
        };

    return (
      <div className="min-h-[60vh] flex flex-col justify-center text-sm font-sans">
        <AnimatePresence mode="wait">
          {message ? (
            <motion.div key="zen-reflection" variants={zenVariants} initial="hidden" animate="visible" exit="hidden">
              <ReflectionMessage
                message={message} context={context} onDismiss={handleDismiss}
                companions={companions}
                companionPrefs={{ breathing: companionPrefs.breathing, haiku: false, grounding: false, signal: false, zoomOut: false, history: false }}
                severity={severity} pauseInstanceId={lastPauseInstanceId}
              />
            </motion.div>
          ) : loading ? (
            <motion.div key="zen-loading" variants={zenVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <p className="text-xs font-mono">{t('home.generatingReflection')}</p>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </motion.div>
          ) : isPausePersistError(error) ? (
            <motion.div
              key="zen-reflection-save-error"
              variants={zenVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 space-y-2 max-w-md mx-auto text-left"
            >
              <div className="flex items-center gap-2 text-destructive/80">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <p className="text-xs font-mono">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  holzenLog.home('Try again after pause persist error: manualTrigger');
                  manualTrigger();
                }}
                className="text-xs font-mono text-primary underline"
              >
                {t('common.tryAgain')}
              </button>
            </motion.div>
          ) : !subscriptionReady ? (
            <motion.div key="zen-hydrating" variants={zenVariants} initial="hidden" animate="visible" exit="hidden">
              <SubscriptionSkeleton variant="centered" />
            </motion.div>
          ) : (
            <motion.div key="zen-empty" variants={zenVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-6 text-center">
              {hasAccess && !showLimitUpsell ? (
                <>
                  <p className="text-sm text-muted-foreground font-mono leading-relaxed">{t('home.noActiveReflection')}</p>
                  <NeedAMomentButton onTrigger={handleNeedAPause} cooldownRemaining={manualCooldownRemaining} loading={loading} />
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                    {t('home.subscription.monthlyLimitReached', {
                      defaultValue: "You've used your free pauses this month.",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground/60 font-mono leading-relaxed max-w-[280px] mx-auto">
                    {t('home.subscription.upgradeToPro')}
                  </p>
                  <LoadingButton onClick={() => startCheckout('pro')} loading={checkoutLoading} loadingText={t('home.subscription.openingCheckout')} size="sm" className="font-mono text-xs">
                    {t('pro.upgradeCta')}
                  </LoadingButton>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const pauseCardBody = (
    <div className="space-y-4">
      <BulkHoldCard />

      {showPauseScheduling ? (
        <div className="space-y-0.5">
          <AutoCooldownIndicator
            cooldownRemaining={autoCooldownRemaining}
            cooldownHours={cooldownHours}
            nextCronCheckIn={nextCronCheckIn}
          />
        </div>
      ) : null}

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
              <div className="space-y-2 min-w-0">
                <p
                  className={cn(homeInWidget.bodyLead, 'truncate')}
                  title={message}
                >
                  {message}
                </p>
                {(pauseContextHomePreview.btc24h || pauseContextHomePreview.marketSentiment) ? (
                  <div className={cn(homeInWidget.meta, 'mt-2 space-y-1')}>
                    {pauseContextHomePreview.btc24h ? (
                      <p className="leading-snug">{pauseContextHomePreview.btc24h}</p>
                    ) : null}
                    {pauseContextHomePreview.marketSentiment ? (
                      <p className="leading-snug">{pauseContextHomePreview.marketSentiment}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
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
                    messageLen: message?.length ?? 0,
                    hasContext: !!context,
                    companionKeys: companions
                      ? Object.entries(companions)
                          .filter(([, v]) => v != null)
                          .map(([k]) => k)
                      : [],
                  });
                  navigate('/pause', { state: navState });
                }}
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
              ) : (error && !btcData) || isPausePersistError(error) ? (
                <div className={homeInWidget.errorPanel}>
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-sm font-medium leading-snug">
                      {isPausePersistError(error)
                        ? error
                        : error.includes('fetch') || error.includes('network') || error.includes('Failed to fetch')
                          ? t('home.errors.couldNotReachPrice')
                          : error.includes('generate') || error.includes('reflect')
                            ? t('home.errors.aiUnavailable')
                            : t('home.errors.somethingWentWrong')}
                    </p>
                  </div>
                  {!isPausePersistError(error) && (
                    <p className={homeInWidget.meta}>
                      {error.includes('fetch') || error.includes('network') || error.includes('Failed to fetch')
                        ? t('home.errors.checkConnection')
                        : error.includes('generate') || error.includes('reflect')
                          ? t('home.errors.aiTemporarilyUnavailable')
                          : t('home.errors.unexpectedError')}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      holzenLog.home('Try again: manualTrigger');
                      manualTrigger();
                    }}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t('common.tryAgain')}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {pinnedPausePreview && (
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
                      <p className={homeInWidget.body}>{pinnedPausePreview.message}</p>
                    </div>
                  )}
                  <NeedAMomentButton onTrigger={handleNeedAPause} cooldownRemaining={manualCooldownRemaining} loading={loading} />
                </div>
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
              btcMode={btcMode}
              onToggleBtcMode={toggleBtcMode}
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
        {!hasTodaySegment ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleCustomizeOpenChange(true)}
              className="text-sm font-medium text-primary underline underline-offset-4"
            >
              {t('home.customize')}
            </button>
          </div>
        ) : null}
        {homeSegments.map((seg, segIdx) => {
          if (seg.type === 'plain') {
            if (seg.id === JOURNEY_STAT_TILES_VISIBILITY_ID) {
              if (!showJourneyStatTiles) return null;
              return (
                <div key={`${seg.type}-${seg.id}-${segIdx}`}>
                  <HomeStatTiles />
                </div>
              );
            }
            const node = renderHomeSection(seg.id);
            if (node == null) return null;
            return (
              <div key={`${seg.type}-${seg.id}-${segIdx}`}>{node}</div>
            );
          }
          const tilesAtTop = showHomeStatTilesAtTopOfToday(seg.ids);
          return (
            <section
              key={`today-${segIdx}`}
              aria-labelledby={`home-today-heading-${segIdx}`}
              className="space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 id={`home-today-heading-${segIdx}`} className="text-base font-medium text-foreground">
                  {t('home.today')}
                </h2>
                {firstTodaySegmentIndex === segIdx ? (
                  <button
                    type="button"
                    onClick={() => handleCustomizeOpenChange(true)}
                    className="shrink-0 text-sm font-medium text-primary underline underline-offset-4"
                  >
                    {t('home.customize')}
                  </button>
                ) : null}
              </div>
              <div className="space-y-4">
                {tilesAtTop ? (
                  <div key={`today-stat-tiles-${segIdx}`}>
                    <HomeStatTiles />
                  </div>
                ) : null}
                {(tilesAtTop
                  ? seg.ids.filter((id) => id !== JOURNEY_STAT_TILES_VISIBILITY_ID)
                  : seg.ids
                ).map((sectionId) => {
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
          );
        })}
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
        onZenModeChange={handleZenModeFromCustomize}
        onResetAll={handleCustomizeResetAll}
        nightToggleDisabled={!subscribed}
        dndRemountKey={customizeDndEpoch}
      />

      <TestimonialRequest completedPauseCount={completedPauseCount} />
    </div>
  );
};

export default Home;
