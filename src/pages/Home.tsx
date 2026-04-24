import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useOutletContext } from 'react-router-dom';
import { useHolzen } from '@/hooks/use-holzen';
import { isReflectionPersistError } from '@/lib/reflection-persist-error';
import { TestimonialRequest } from '@/components/TestimonialRequest';
import { LetterToFutureSelf } from '@/components/LetterToFutureSelf';
import AuthLoading from '@/components/AuthLoading';
import { useSubscription } from '@/hooks/use-subscription';
import { BtcStatus } from '@/components/BtcStatus';
import { NightReflectionCard, useNightReflection } from '@/components/NightReflectionCard';
import { ReflectionMessage } from '@/components/ReflectionMessage';
import { HolzenNumber } from '@/components/HolzenNumber';
import { Onboarding } from '@/components/Onboarding';
import { HoldGoalWidget } from '@/components/HoldGoalWidget';
import { MyWhyWidget } from '@/components/MyWhyWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionSkeleton } from '@/components/SubscriptionSkeleton';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { NoxHeaderMain } from '@/components/ui/nox-header';
import { HomeWidget, useWidgetLayout } from '@/components/HomeWidget';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { AlertCircle, Loader2, Pin, Sparkles, Waves, RotateCcw, RefreshCw, X, Anchor } from 'lucide-react';
import { AutoCooldownIndicator, NeedAMomentButton, ProLockedWidget } from '@/components/home/HomePauseChrome';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';
import { PracticeWidget } from '@/components/PracticeWidget';
import { BulkHoldCard } from '@/components/BulkHoldCard';
import { InstallHolzenCard } from '@/components/InstallHolzenCard';
import { SnoozeControl } from '@/components/SnoozeControl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { playNotificationTone, prefetchNotificationTone } from '@/lib/notification-tone';
import { isCumulativeMoveTriggered } from '@/lib/volatility-thresholds';
import { holzenLog } from '@/lib/holzen-console';
import { companionFallbacksDisabledClient } from '@/lib/companion-strict';
import { type GroundPreGenerated, type PauseSessionLocationState } from '@/lib/router-location-state';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Widget IDs
const WIDGET_IDS = ['btc-status', 'hold-goal', 'reflection', 'ground', 'night', 'letter', 'practice', 'breathe'] as const;
type WidgetId = typeof WIDGET_IDS[number];

interface PinnedReflection {
  id: string;
  message: string;
  context: string | null;
  haiku: string | null;
  grounding_title: string | null;
  grounding_body: string | null;
}

const Home = () => {
  const { t } = useTranslation();
  const WIDGET_TITLES: Record<WidgetId, string> = {
    'btc-status': t('home.widget.market'),
    'hold-goal': t('home.widget.goal'),
    'reflection': t('home.widget.reflection'),
    'ground': t('home.widget.ground', 'Ground'),
    'night': t('home.widget.evening'),
    'letter': t('home.widget.letter'),
    'practice': t('home.widget.practice', 'Practice'),
    'breathe': t('home.widget.breathe', 'Stillness'),
  };
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribed, loading: subLoading, monthlyRemaining, checkoutLoading, startCheckout, refresh } = useSubscription();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('subscribed') === 'true') {
      refresh();
      toast.success(t('pro.welcomeToast', '🎉 Welcome to Pro! All features are now unlocked.'));
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
    newReflection,
    clearNewReflection,
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
    groundingActivities,
    threshold,
    thresholdDown,
    cumulativeThreshold,
    language,
    profileLoaded,
    refreshProfile,
  } = useHolzen();

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
  const [zenMode] = useState(() => localStorage.getItem('holzen_zen_mode') === 'true');
  const [pinnedReflection, setPinnedReflection] = useState<PinnedReflection | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [reflectionCount, setReflectionCount] = useState(0);

  // Grounding suggestion state (mirrors pause message pattern)
  const groundStorageKey = user ? `holzen_ground_suggestion_${user.id}` : 'holzen_ground_suggestion';
  const groundDismissedKey = user ? `holzen_ground_dismissed_${user.id}` : 'holzen_ground_dismissed';
  const groundDismissedRef = useRef(() => {
    try { return localStorage.getItem(groundDismissedKey) === 'true'; } catch { return false; }
  });
  const [groundDismissed, setGroundDismissed] = useState(() => groundDismissedRef.current());
  const strictNoFallback = companionFallbacksDisabledClient();
  const [groundSuggestion, setGroundSuggestion] = useState<GroundPreGenerated | null>(() => {
    if (companionFallbacksDisabledClient()) return null;
    try {
      const stored = localStorage.getItem(user ? `holzen_ground_suggestion_${user.id}` : 'holzen_ground_suggestion');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [groundLoading, setGroundLoading] = useState(false);
  const groundFetchingRef = useRef(false);


  // Widget layout
  const defaultOrder = useMemo(() => [...WIDGET_IDS], []);
  const { order, collapsed, reorder, toggleCollapsed, resetLayout } = useWidgetLayout(defaultOrder);

  // DnD sensors with activation constraints to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        reorder(arrayMove(order, oldIndex, newIndex));
      }
    },
    [order, reorder],
  );

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
      setPinnedReflection({
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
        if (count != null) setReflectionCount(count);
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
    // Suppress grounding auto-generation when user explicitly dismisses a pause notification
    setGroundDismissed(true);
    localStorage.setItem(groundDismissedKey, 'true');
  };

  const dismissGroundSuggestion = useCallback(() => {
    setGroundSuggestion(null);
    localStorage.removeItem(groundStorageKey);
    setGroundDismissed(true);
    localStorage.setItem(groundDismissedKey, 'true');
  }, [groundStorageKey, groundDismissedKey]);

  // No cached grounding card when testing strict live paths — clear persisted suggestions
  useEffect(() => {
    if (!strictNoFallback) return;
    setGroundSuggestion(null);
    try {
      if (user?.id) localStorage.removeItem(`holzen_ground_suggestion_${user.id}`);
      localStorage.removeItem('holzen_ground_suggestion');
    } catch { /* ignore */ }
  }, [strictNoFallback, user?.id]);

  const handleStartGround = useCallback(() => {
    navigate('/ground', { state: { preGenerated: groundSuggestion } });
  }, [navigate, groundSuggestion]);

  const lastToneMsgRef = useRef<string | null>(null);
  useEffect(() => {
    if (newReflection && message) {
      // Only play tone once per unique message to prevent double-play
      if (message !== lastToneMsgRef.current) {
        lastToneMsgRef.current = message;
        const soundEnabled = localStorage.getItem('holzen_sound_enabled') !== 'false';
        if (soundEnabled) {
          playNotificationTone();
        }
      }
      clearNewReflection();
    }
  }, [newReflection, message, clearNewReflection]);

  useEffect(() => {
    prefetchNotificationTone();
  }, []);

  // Reset grounding dismissed flag when a new pause message arrives (new volatility cycle)
  const prevMessageRef = useRef(message);
  useEffect(() => {
    if (message && !prevMessageRef.current) {
      // A new pause just appeared — reset dismissed so grounding can auto-suggest after pause
      setGroundDismissed(false);
      localStorage.removeItem(groundDismissedKey);
    }
    prevMessageRef.current = message;
  }, [message, groundDismissedKey]);

  // Pre-generate grounding suggestion when thresholds are met (mirrors pause pre-generation)
  useEffect(() => {
    if (!user || !profileLoaded || !subscribed || !btcData || groundingActivities.length === 0) return;
    // Don't pre-generate if there's an active pause message (pause takes priority)
    if (message) return;
    // Don't pre-generate if user already dismissed this session, or we already have one
    if (groundDismissed || groundSuggestion || groundFetchingRef.current) return;

    const effectiveThreshold = btcData.changePercent < 0 ? thresholdDown : threshold;
    const dailyTriggered = Math.abs(btcData.changePercent) >= effectiveThreshold;
    const cumulativeTriggered = isCumulativeMoveTriggered(btcData.cumulativeChangePercent, cumulativeThreshold);

    if (!dailyTriggered && !cumulativeTriggered) return;

    groundFetchingRef.current = true;
    setGroundLoading(true);

    const ctx = `BTC is ${btcData.direction === 'down' ? 'down' : 'up'} ${Math.abs(btcData.changePercent).toFixed(1)}% in the last 24 hours.`;

    supabase.functions.invoke('suggest-grounding', {
      body: { groundingActivities, context: ctx, severity, language, consumeQuota: false },
    }).then(({ data, error }) => {
      if (error || !data || data.error) return;
      const suggestion: GroundPreGenerated = {
        activity: data.activity,
        suggestion: data.suggestion,
        duration: data.duration || 10,
        insight: data.insight || null,
        article: data.article || null,
      };
      setGroundSuggestion(suggestion);
      if (!strictNoFallback) {
        localStorage.setItem(groundStorageKey, JSON.stringify(suggestion));
      }
    }).finally(() => {
      setGroundLoading(false);
      groundFetchingRef.current = false;
    });
  }, [user, profileLoaded, subscribed, btcData, message, groundDismissed, groundSuggestion, groundingActivities, threshold, thresholdDown, cumulativeThreshold, severity, language, groundStorageKey, strictNoFallback]);

  useEffect(() => {
    document.title = 'Holzen — Home';
    return () => { document.title = 'Holzen — Pause before you act'; };
  }, []);

  const unpinReflection = useCallback(() => {
    localStorage.removeItem('holzen_pinned_reflection');
    setPinnedReflection(null);
  }, []);

  const handlePullRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  const { pullDistance, refreshing: pullRefreshing, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handlePullRefresh,
  });

  if (!profileLoaded) {
    return <AuthLoading />;
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const hasAccess = subscribed || ((monthlyRemaining ?? 0) > 0);
  const subscriptionReady = !subLoading && (subscribed || monthlyRemaining !== undefined);
  const showLimitUpsell = subscriptionReady && !subscribed && monthlyRemaining === 0;
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
                <p className="text-xs font-mono">Generating reflection…</p>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </motion.div>
          ) : isReflectionPersistError(error) ? (
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
                  holzenLog.home('Try again after reflection save error: manualTrigger');
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
                    {t('home.subscription.monthlyLimitReached', 'You\'ve used your free pauses this month.')}
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

  // --- Widget content renderers ---
  const renderWidget = (widgetId: string) => {
    switch (widgetId as WidgetId) {
      case 'btc-status':
        return (
          <HomeWidget
            id="btc-status"
            title={WIDGET_TITLES['btc-status']}
            collapsed={collapsed['btc-status']}
            onToggleCollapse={() => toggleCollapsed('btc-status')}
          >
            <div className="space-y-4">
              <BtcStatus data={btcData} error={error} hidden={priceHidden} onToggleHidden={togglePriceHidden} currency={currency} btcMode={btcMode} onToggleBtcMode={toggleBtcMode} />
              <div className="space-y-0.5">
                <HolzenNumber variant="compact" />
                <AutoCooldownIndicator cooldownRemaining={autoCooldownRemaining} cooldownHours={cooldownHours} nextCronCheckIn={nextCronCheckIn} />
                <SnoozeControl />
              </div>
            </div>
          </HomeWidget>
        );

      case 'hold-goal':
        return (
          <HomeWidget
            id="hold-goal"
            title={WIDGET_TITLES['hold-goal']}
            collapsed={collapsed['hold-goal']}
            onToggleCollapse={() => toggleCollapsed('hold-goal')}
          >
            <div className="space-y-3">
              <HoldGoalWidget currentPrice={btcData?.currentPrice} />
              <MyWhyWidget />
            </div>
          </HomeWidget>
        );

      case 'reflection':
        return (
          <HomeWidget
            id="reflection"
            title={WIDGET_TITLES['reflection']}
            alwaysOpen
          >
            <div className="space-y-4">
              {/* Bulk hold for accumulated pauses */}
              <BulkHoldCard />

              {/* 24h follow-up check-in */}

              {!subLoading && !hasAccess ? (
                <div className="space-y-3">
                  <p className={homeInWidget.bodyMuted}>
                    {t('home.subscription.monthlyLimitReached')}
                  </p>
                  <p className={`${homeInWidget.meta} mb-[16px]`}>
                    {t('home.subscription.upgradeToPro')}
                  </p>
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
                    <p className={homeInWidget.meta}>
                      {t('home.subscription.freeRemaining', { count: monthlyRemaining })}
                    </p>
                  )}

                  {message ? (
                    <div className="space-y-4">
                      {/* Reflection teaser with dismiss X */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={handleDismiss}
                          className={homeInWidget.dismissAbs}
                          aria-label={t('common.dismiss', 'Dismiss')}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <p className={cn(homeInWidget.bodyLead, 'pr-5')}>
                          {message.split(/[.!?]\s/)[0]}{message.split(/[.!?]\s/).length > 1 ? '…' : ''}
                        </p>
                        {context && (
                          <p className={cn(homeInWidget.meta, 'mt-2')}>
                            {context.slice(0, 72)}{context.length > 72 ? '…' : ''}
                          </p>
                        )}
                      </div>
                      <button
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
                        className={homeInWidget.ctaPrimary}
                      >
                        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
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
                      ) : (error && !btcData) || isReflectionPersistError(error) ? (
                        <div className={homeInWidget.errorPanel}>
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <p className="text-sm font-medium leading-snug">
                              {isReflectionPersistError(error)
                                ? error
                                : error.includes('fetch') || error.includes('network') || error.includes('Failed to fetch')
                                ? t('home.errors.couldNotReachPrice')
                                : error.includes('generate') || error.includes('reflect')
                                ? t('home.errors.aiUnavailable')
                                : t('home.errors.somethingWentWrong')}
                            </p>
                          </div>
                          {!isReflectionPersistError(error) && (
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
                          {pinnedReflection && (
                            <div className={cn(homeInWidget.inset, 'space-y-3')}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Pin className="h-3.5 w-3.5 shrink-0" />
                                  <span className={homeInWidget.kicker}>{t('common.pinned')}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={unpinReflection}
                                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                  {t('common.unpin')}
                                </button>
                              </div>
                              <p className={homeInWidget.body}>{pinnedReflection.message}</p>
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
          </HomeWidget>
        );

      case 'ground': {
        if (groundingActivities.length === 0) return null;

        const effectiveThreshold = btcData
          ? (btcData.changePercent < 0 ? thresholdDown : threshold)
          : threshold;
        const dailyTriggered = btcData ? Math.abs(btcData.changePercent) >= effectiveThreshold : false;
        const cumulativeTriggered = btcData
          ? isCumulativeMoveTriggered(btcData.cumulativeChangePercent, cumulativeThreshold)
          : false;
        const followsPauseThresholds = dailyTriggered || cumulativeTriggered;

        const shouldNudgeGround = followsPauseThresholds && subscribed && !message;
        const hasPreview = groundSuggestion !== null;
        // Ground should NEVER glow when an active pause message exists — pause is always the hero
        // Even without pause, grounding glow is deliberately subtle to not steal focus
        const showGlow = !message && hasPreview;
        const glowClass = showGlow
          ? 'ring-1 ring-border/20'
          : '';
        const effectiveCollapsed = hasPreview ? false : collapsed['ground'];

        return (
          <HomeWidget
            id="ground"
            title={hasPreview
              ? `${WIDGET_TITLES['ground']} · ${groundSuggestion.activity}`
              : shouldNudgeGround
              ? `${WIDGET_TITLES['ground']} · ${t('home.groundNudge', 'maybe now?')}`
              : WIDGET_TITLES['ground']}
            collapsed={effectiveCollapsed}
            onToggleCollapse={() => toggleCollapsed('ground')}
            className={glowClass}
          >
            <div className="space-y-3">
              {/* Pre-generated suggestion preview (mirrors pause message preview) */}
              {hasPreview ? (
                <>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={dismissGroundSuggestion}
                      className={homeInWidget.dismissAbs}
                      aria-label={t('common.dismiss', 'Dismiss')}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <p className={cn(homeInWidget.body, 'pr-5')}>
                      {groundSuggestion.suggestion}
                    </p>
                    <p className={cn(homeInWidget.meta, 'mt-2')}>
                      {groundSuggestion.duration} min · {groundSuggestion.activity}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartGround}
                    className={homeInWidget.ctaSecondary}
                  >
                    <Anchor className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {t('home.groundYourself', 'Ground yourself')}
                  </button>
                </>
              ) : groundLoading ? (
                <div className="space-y-3">
                  <div className={homeInWidget.loadingRow}>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    <p className={homeInWidget.bodyMuted}>{t('home.groundFinding', 'Finding what fits…')}</p>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <>
                  {shouldNudgeGround && (
                    <p className={cn(homeInWidget.body, 'font-medium text-primary')}>
                      {t('home.groundVolatileHint', 'The market is moving. A good moment to ground.')}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {groundingActivities.slice(0, 4).map((activity) => (
                      <span
                        key={activity}
                        className={homeInWidget.pillMuted}
                      >
                        {activity}
                      </span>
                    ))}
                  </div>

                  {subscribed ? (
                    <button
                      type="button"
                      onClick={() => navigate('/ground')}
                      className={cn(homeInWidget.ctaPrimary, shouldNudgeGround && homeInWidget.ctaPrimaryEmphasis)}
                    >
                      <Anchor className="h-4 w-4 shrink-0 text-primary" />
                      {t('home.groundYourself', 'Ground yourself')}
                    </button>
                  ) : (
                    <ProLockedWidget onUpgrade={startCheckout} checkoutLoading={checkoutLoading} feature="grounding" />
                  )}
                </>
              )}

              {subscribed && (
                <button
                  type="button"
                  onClick={() => navigate('/ground/history')}
                  className="w-full pt-1 text-center text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline"
                >
                  {t('home.groundJournal', 'View journal')}
                </button>
              )}
            </div>
          </HomeWidget>
        );
      }

      case 'night':
        if (!nightReflection || !subscribed) return null;
        return (
          <HomeWidget
            id="night"
            title={WIDGET_TITLES['night']}
            collapsed={collapsed['night']}
            onToggleCollapse={() => toggleCollapsed('night')}
          >
            <NightReflectionCard reflection={nightReflection} onDismiss={dismissNight} />
          </HomeWidget>
        );

      case 'letter':
        if (!btcData) return null;
        if (!subscribed) return (
          <HomeWidget id="letter" title={WIDGET_TITLES['letter']} collapsed={collapsed['letter']} onToggleCollapse={() => toggleCollapsed('letter')}>
            <ProLockedWidget onUpgrade={startCheckout} checkoutLoading={checkoutLoading} feature="letters" />
          </HomeWidget>
        );
        return (
          <HomeWidget
            id="letter"
            title={WIDGET_TITLES['letter']}
            collapsed={collapsed['letter']}
            onToggleCollapse={() => toggleCollapsed('letter')}
          >
            <LetterToFutureSelf currentPrice={btcData.currentPrice} changePercent={btcData.changePercent} />
          </HomeWidget>
        );

      case 'practice':
        return (
          <HomeWidget
            id="practice"
            title={WIDGET_TITLES['practice']}
            collapsed={collapsed['practice']}
            onToggleCollapse={() => toggleCollapsed('practice')}
          >
            <PracticeWidget />
          </HomeWidget>
        );

      case 'breathe':
        if (!subscribed) return (
          <HomeWidget id="breathe" title={WIDGET_TITLES['breathe']} collapsed={collapsed['breathe']} onToggleCollapse={() => toggleCollapsed('breathe')}>
            <ProLockedWidget onUpgrade={startCheckout} checkoutLoading={checkoutLoading} feature="stillness" />
          </HomeWidget>
        );
        return (
          <HomeWidget
            id="breathe"
            title={WIDGET_TITLES['breathe']}
            collapsed={collapsed['breathe']}
            onToggleCollapse={() => toggleCollapsed('breathe')}
          >
            <div className="space-y-3">
              <p className={homeInWidget.bodyMuted}>
                {t('home.breatheDesc', 'A quiet space to find stillness. No goals, no tracking.')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/breathe')}
                className={homeInWidget.ctaSecondary}
              >
                <Waves className="h-4 w-4 shrink-0 text-muted-foreground" />
                {t('home.enterStillness', 'Enter stillness')}
              </button>
            </div>
          </HomeWidget>
        );

      default:
        return null;
    }
  };

  const isDefaultOrder = order.every((id, i) => id === defaultOrder[i]);
  const hasCollapsed = Object.values(collapsed).some(Boolean);

  const headerRightSlot =
    !isDefaultOrder || hasCollapsed ? (
      <button
        type="button"
        onClick={resetLayout}
        className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Reset widget layout"
      >
        <RotateCcw className="h-3 w-3" />
        {t('common.reset')}
      </button>
    ) : undefined;

  return (
    <div {...pullHandlers} className="space-y-6">
      <div className="space-y-2">
        <NoxHeaderMain title={t('home.title', 'Home')} subtitle={t('home.whenBtcMoves')} rightSlot={headerRightSlot} />
        {firstName ? (
          <p className={cn(homeInWidget.bodyMuted, 'leading-snug')}>{t('home.greeting', { name: firstName })}</p>
        ) : null}
      </div>
      {/* Install card — first protected visit, dismissible */}
      <InstallHolzenCard />
      {/* Pull-to-refresh indicator */}
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
      {/* Draggable widgets */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {order.map((widgetId) => {
              const content = renderWidget(widgetId);
              // Don't render null widgets (e.g. letter when no access)
              if (content === null) return null;
              return <div key={widgetId}>{content}</div>;
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Modals (outside widget flow) */}

      {/* Testimonial request */}
      <TestimonialRequest reflectionCount={reflectionCount} />
    </div>
  );
};

export default Home;
