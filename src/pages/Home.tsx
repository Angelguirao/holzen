import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useOutletContext } from 'react-router-dom';
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
import { HoldGoalWidget } from '@/components/HoldGoalWidget';
import { MyWhyWidget } from '@/components/MyWhyWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionSkeleton } from '@/components/SubscriptionSkeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import { NoxHeaderMain } from '@/components/ui/nox-header';
import { HomeWidget, useWidgetLayout } from '@/components/HomeWidget';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { AlertCircle, Loader2, Pin, Sparkles, RotateCcw, RefreshCw, X } from 'lucide-react';
import { AutoCooldownIndicator, NeedAMomentButton } from '@/components/home/HomePauseChrome';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';
import { BulkHoldCard } from '@/components/BulkHoldCard';
import { InstallHolzenCard } from '@/components/InstallHolzenCard';
import { HomeJourneyPulse } from '@/components/home/HomeJourneyPulse';
import { HomeQuickCapture } from '@/components/home/HomeQuickCapture';
import { SnoozeControl } from '@/components/SnoozeControl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { playNotificationTone, prefetchNotificationTone } from '@/lib/notification-tone';
import { holzenLog } from '@/lib/holzen-console';
import { type PauseSessionLocationState } from '@/lib/router-location-state';
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
const WIDGET_IDS = ['reflection', 'btc-status', 'hold-goal', 'journey-pulse', 'quick-capture', 'night'] as const;
type WidgetId = typeof WIDGET_IDS[number];

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
  const WIDGET_TITLES: Record<WidgetId, string> = {
    'btc-status': t('home.widget.market'),
    'hold-goal': t('home.widget.goal'),
    'reflection': t('home.widget.reflection'),
    'journey-pulse': t('home.widget.journeyPulse'),
    'quick-capture': t('home.widget.quickCapture'),
    'night': t('home.widget.evening'),
  };
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribed, loading: subLoading, monthlyRemaining, checkoutLoading, startCheckout, refresh } = useSubscription();
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
  const [pinnedPausePreview, setPinnedPausePreview] = useState<PinnedPausePreview | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [completedPauseCount, setCompletedPauseCount] = useState(0);

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
                          aria-label={t('common.dismiss', { defaultValue: 'Dismiss' })}
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
          </HomeWidget>
        );

      case 'journey-pulse':
        return (
          <HomeWidget
            id="journey-pulse"
            title={WIDGET_TITLES['journey-pulse']}
            collapsed={collapsed['journey-pulse']}
            onToggleCollapse={() => toggleCollapsed('journey-pulse')}
          >
            <HomeJourneyPulse />
          </HomeWidget>
        );

      case 'quick-capture':
        return (
          <HomeWidget
            id="quick-capture"
            title={WIDGET_TITLES['quick-capture']}
            collapsed={collapsed['quick-capture']}
            onToggleCollapse={() => toggleCollapsed('quick-capture')}
          >
            <HomeQuickCapture />
          </HomeWidget>
        );

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
        <NoxHeaderMain
          title={t('home.title', { defaultValue: 'Home' })}
          subtitle={t('home.whenBtcMoves')}
          rightSlot={headerRightSlot}
        />
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
              // Don't render null widgets
              if (content === null) return null;
              return <div key={widgetId}>{content}</div>;
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Modals (outside widget flow) */}

      {/* Testimonial request */}
      <TestimonialRequest completedPauseCount={completedPauseCount} />
    </div>
  );
};

export default Home;
