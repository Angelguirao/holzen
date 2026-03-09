import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useHolzen } from '@/hooks/use-holzen';
import { TestimonialRequest } from '@/components/TestimonialRequest';
import { LetterToFutureSelf } from '@/components/LetterToFutureSelf';
import { TheVoid } from '@/components/TheVoid';
import { HolzenRitual, type RitualTemplate } from '@/components/HolzenRitual';
import { RitualCooldownBanner } from '@/components/RitualCooldownBanner';
import { useSubscription } from '@/hooks/use-subscription';
import { BtcStatus } from '@/components/BtcStatus';
import { NightReflectionCard, useNightReflection } from '@/components/NightReflectionCard';
import { ReflectionMessage } from '@/components/ReflectionMessage';
import { OutcomePrompt } from '@/components/OutcomePrompt';
import { HolzenNumber } from '@/components/HolzenNumber';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';
import { ReflectionComparison } from '@/components/ReflectionComparison';
import { Onboarding } from '@/components/Onboarding';
import { HoldGoalWidget } from '@/components/HoldGoalWidget';
import { MyWhyWidget } from '@/components/MyWhyWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { HomeWidget, useWidgetLayout } from '@/components/HomeWidget';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { AlertCircle, Loader2, Pause, Pin, Timer, Circle, Sparkles, Waves, RotateCcw, RefreshCw, Lock } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { playNotificationTone, prefetchNotificationTone } from '@/lib/notification-tone';
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
const WIDGET_IDS = ['btc-status', 'hold-goal', 'reflection', 'night', 'letter', 'actions'] as const;
type WidgetId = typeof WIDGET_IDS[number];

interface PinnedReflection {
  id: string;
  message: string;
  context: string | null;
  haiku: string | null;
  learning_title: string | null;
  learning_body: string | null;
}

const Home = () => {
  const { t } = useTranslation();
  const WIDGET_TITLES: Record<WidgetId, string> = {
    'btc-status': t('home.widget.market'),
    'hold-goal': t('home.widget.goal'),
    'reflection': t('home.widget.reflection'),
    'night': t('home.widget.evening'),
    'letter': t('home.widget.letter'),
    'actions': t('home.widget.practice'),
  };
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribed, loading: subLoading, monthlyRemaining, canReflect, checkoutLoading, startCheckout, refresh } = useSubscription();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('subscribed') === 'true') {
      refresh();
    }
  }, [searchParams, refresh]);

  const {
    btcData,
    message,
    context,
    companions,
    companionPrefs,
    severity,
    lastReflectionId,
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
    cooldownHours,
    firstName,
    ritualTemplate,
    currency,
  } = useHolzen();

  const { reflection: nightReflection, dismiss: dismissNight } = useNightReflection();

  const [showVoid, setShowVoid] = useState(false);
  const [showRitual, setShowRitual] = useState(false);
  const [priceHidden, setPriceHidden] = useState(() => localStorage.getItem('holzen_hide_price') === 'true');
  const [btcMode, setBtcMode] = useState(() => localStorage.getItem('holzen_btc_mode') === 'true');
  const [zenMode] = useState(() => localStorage.getItem('holzen_zen_mode') === 'true');
  const [pinnedReflection, setPinnedReflection] = useState<PinnedReflection | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [reflectionCount, setReflectionCount] = useState(0);

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

  // Load pinned reflection
  useEffect(() => {
    if (!user) return;
    const pinnedId = localStorage.getItem('holzen_pinned_reflection');
    if (!pinnedId) return;
    supabase
      .from('reflections')
      .select('id, message, context, haiku, learning_title, learning_body')
      .eq('id', pinnedId)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setPinnedReflection(data as unknown as PinnedReflection);
        else localStorage.removeItem('holzen_pinned_reflection');
      });
  }, [user]);

  // Fetch reflection count for testimonial prompt
  useEffect(() => {
    if (!user) return;
    supabase.from('reflections').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }) => { if (count != null) setReflectionCount(count); });
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
    if (manualCooldownRemaining() > 0) return;
    manualTrigger();
  };

  const handleDismiss = () => {
    dismissMessage();
  };

  useEffect(() => {
    if (newReflection && message) {
      playNotificationTone();
      toast('New reflection', {
        description: message.slice(0, 80) + (message.length > 80 ? '…' : ''),
        duration: 6000,
      });
      clearNewReflection();
    }
  }, [newReflection, message, clearNewReflection]);

  useEffect(() => {
    prefetchNotificationTone();
  }, []);

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

  if (!hasOnboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const hasAccess = canReflect;

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
      <div className="min-h-[60vh] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {message ? (
            <motion.div key="zen-reflection" variants={zenVariants} initial="hidden" animate="visible" exit="hidden">
              <ReflectionMessage
                message={message} context={context} onDismiss={handleDismiss}
                companions={companions}
                companionPrefs={{ breathing: companionPrefs.breathing, haiku: false, learning: false, signal: false, zoomOut: false, history: false }}
                severity={severity} reflectionId={lastReflectionId}
              />
            </motion.div>
          ) : showOutcome && outcomeReflectionId ? (
            <motion.div key="zen-outcome" variants={zenVariants} initial="hidden" animate="visible" exit="hidden">
              <OutcomePrompt reflectionId={outcomeReflectionId} onComplete={handleOutcomeComplete} />
            </motion.div>
          ) : showMoodCheck ? (
            <motion.div key="zen-mood" variants={zenVariants} initial="hidden" animate="visible" exit="hidden">
              <MoodCheck onSelect={handleMoodSelected} onSkip={handleMoodSkipped} />
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
          ) : (
            <motion.div key="zen-empty" variants={zenVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-6 text-center">
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">{t('home.noActiveReflection')}</p>
              {hasAccess && (
                <NeedAMomentButton onTrigger={handleNeedAMoment} cooldownRemaining={manualCooldownRemaining} loading={loading} />
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
              <HolzenNumber variant="compact" />
              <AutoCooldownIndicator cooldownRemaining={autoCooldownRemaining} cooldownHours={cooldownHours} />
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
              <RitualCooldownBanner />

              {!subLoading && !hasAccess ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('home.subscription.monthlyLimitReached')}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {t('home.subscription.upgradeToPro')}
                  </p>
                  <Button onClick={startCheckout} disabled={checkoutLoading} className="w-full font-mono text-xs">
                    {checkoutLoading ? t('home.subscription.openingCheckout') : t('pro.upgradeCta')}
                  </Button>
                </div>
              ) : subLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  {!subscribed && monthlyRemaining !== undefined && monthlyRemaining > 0 && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {t('home.subscription.freeRemaining', { count: monthlyRemaining })}
                    </p>
                  )}

                  {message ? (
                    <div className="space-y-4">
                      {/* First-line teaser */}
                      <p className="text-sm leading-relaxed text-foreground/80">
                        {message.split(/[.!?]\s/)[0]}{message.split(/[.!?]\s/).length > 1 ? '…' : ''}
                      </p>
                      {context && (
                        <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">
                          {context.slice(0, 60)}{context.length > 60 ? '…' : ''}
                        </p>
                      )}
                      <button
                        onClick={() => navigate('/pause', {
                          state: {
                            reflectionMessage: message,
                            context,
                            reflectionId: lastReflectionId,
                            companions,
                            companionPrefs,
                            severity,
                          },
                        })}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        <Sparkles className="h-3 w-3 text-primary/60" />
                        <span className="text-[10px] font-mono text-primary/60 tracking-[0.15em] uppercase">
                          {t('onboarding.pauseWithThis')}
                        </span>
                      </button>
                      <button
                        onClick={handleDismiss}
                        className="w-full text-center text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
                      >
                        {t('common.done')}
                      </button>
                    </div>
                  ) : showOutcome && outcomeReflectionId ? (
                    <OutcomePrompt reflectionId={outcomeReflectionId} onComplete={handleOutcomeComplete} />
                  ) : showMoodCheck ? (
                    <MoodCheck onSelect={handleMoodSelected} onSkip={handleMoodSkipped} />
                  ) : (
                    <>
                      {loading ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <p className="text-xs font-mono">{t('home.generatingReflection')}</p>
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ) : error && !btcData ? (
                        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 space-y-2">
                          <div className="flex items-center gap-2 text-destructive/80">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <p className="text-xs font-mono">
                              {error.includes('fetch') || error.includes('network') || error.includes('Failed to fetch')
                                ? t('home.errors.couldNotReachPrice')
                                : error.includes('generate') || error.includes('reflect')
                                ? t('home.errors.aiUnavailable')
                                : t('home.errors.somethingWentWrong')}
                            </p>
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground/60 leading-relaxed">
                            {error.includes('fetch') || error.includes('network') || error.includes('Failed to fetch')
                              ? t('home.errors.checkConnection')
                              : error.includes('generate') || error.includes('reflect')
                              ? t('home.errors.aiTemporarilyUnavailable')
                              : t('home.errors.unexpectedError')}
                          </p>
                          <button onClick={() => manualTrigger()} className="text-xs font-mono text-primary underline">{t('common.tryAgain')}</button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {pinnedReflection && (
                            <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Pin className="h-2.5 w-2.5" />
                                 <span className="text-[10px] font-mono uppercase tracking-wider">{t('common.pinned')}</span>
                              </div>
                              <button onClick={unpinReflection} className="text-[10px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors">{t('common.unpin')}</button>
                              </div>
                              <p className="text-sm leading-relaxed">{pinnedReflection.message}</p>
                            </div>
                          )}
                          <NeedAMomentButton onTrigger={handleNeedAMoment} cooldownRemaining={manualCooldownRemaining} loading={loading} />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
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

      case 'letter':
        if (!btcData) return null;
        if (!subscribed) return (
          <HomeWidget id="letter" title={WIDGET_TITLES['letter']} collapsed={collapsed['letter']} onToggleCollapse={() => toggleCollapsed('letter')}>
            <ProLockedWidget onUpgrade={startCheckout} checkoutLoading={checkoutLoading} />
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

      case 'actions':
        return (
          <HomeWidget
            id="actions"
            title={WIDGET_TITLES['actions']}
            collapsed={collapsed['actions']}
            onToggleCollapse={() => toggleCollapsed('actions')}
          >
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (!subscribed) {
                    toast(t('pro.featureLocked'), { description: t('pro.upgradeDesc'), action: { label: t('pro.upgradeCta'), onClick: () => startCheckout() }, duration: 6000 });
                    return;
                  }
                  setShowRitual(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors duration-300"
              >
                {!subscribed && <Lock className="h-3 w-3 text-primary/20" />}
                <Sparkles className="h-3 w-3 text-primary/40" />
                <span className="text-[10px] font-mono text-primary/40 tracking-[0.2em] uppercase">
                  {t('home.startARitual')}
                </span>
                {!subscribed && <span className="text-[8px] font-mono text-primary/30 uppercase tracking-wider">PRO</span>}
              </button>
              <button
                onClick={() => setShowVoid(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors duration-500"
              >
                <Circle className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[10px] font-mono text-muted-foreground/40 tracking-[0.2em] uppercase">
                  {t('home.enterTheVoid')}
                </span>
              </button>
              <button
                onClick={() => navigate('/ambient')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors duration-500"
              >
                <Waves className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[10px] font-mono text-muted-foreground/40 tracking-[0.2em] uppercase">
                  {t('home.ambientMode')}
                </span>
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

  return (
    <div {...pullHandlers} className="space-y-4">
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
      {/* Greeting + reset */}
      <div className="flex items-center justify-between">
        {firstName ? (
          <p className="text-sm font-mono text-muted-foreground/60">{firstName}.</p>
        ) : <div />}
        {(!isDefaultOrder || hasCollapsed) && (
          <button
            onClick={resetLayout}
            className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            aria-label="Reset widget layout"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            {t('common.reset')}
          </button>
        )}
      </div>

      {/* Draggable widgets */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
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
      <HolzenRitual
        open={showRitual}
        onClose={() => setShowRitual(false)}
        template={(ritualTemplate || 'standard') as RitualTemplate}
        reflectionMessage={message ?? undefined}
        reflectionId={lastReflectionId}
      />
      <TheVoid open={showVoid} onClose={() => setShowVoid(false)} />

      {/* Testimonial request */}
      <TestimonialRequest reflectionCount={reflectionCount} />

      <p className="text-xs text-muted-foreground leading-relaxed">
        {t('home.whenBtcMoves')}
      </p>
    </div>
  );
};

function NeedAMomentButton({
  onTrigger,
  cooldownRemaining,
  loading,
}: {
  onTrigger: () => void;
  cooldownRemaining: () => number;
  loading: boolean;
}) {
  const [remaining, setRemaining] = useState(cooldownRemaining());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(cooldownRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const inCooldown = remaining > 0;
  const minutes = Math.ceil(remaining / 60000);

  return (
    <div className="space-y-3">
      <NeedAMomentButtonInner onTrigger={onTrigger} inCooldown={inCooldown} loading={loading} minutes={minutes} />
    </div>
  );
}

function NeedAMomentButtonInner({ onTrigger, inCooldown, loading, minutes }: { onTrigger: () => void; inCooldown: boolean; loading: boolean; minutes: number }) {
  const { t } = useTranslation();
  return (
    <>
      <Button
        onClick={onTrigger}
        disabled={inCooldown || loading}
        variant="outline"
        className="w-full font-mono text-xs gap-2"
      >
        <Pause className="h-3.5 w-3.5" />
        {loading ? t('home.generatingReflection') : inCooldown
          ? t('home.manualReflectionIn', { minutes })
          : t('home.needAMoment')}
      </Button>
      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        {inCooldown
          ? t('home.cooldownMessage')
          : t('home.requestAnytime')}
      </p>
    </>
  );
}

function AutoCooldownIndicator({
  cooldownRemaining,
  cooldownHours,
}: {
  cooldownRemaining: () => number;
  cooldownHours: number;
}) {
  const [remaining, setRemaining] = useState(cooldownRemaining());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(cooldownRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  if (remaining <= 0) return null;

  const totalMs = cooldownHours * 60 * 60 * 1000;
  const progress = ((totalMs - remaining) / totalMs) * 100;
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);

  const timeLabel = hours > 0
    ? `${hours}h ${minutes}min`
    : `${minutes}min`;

  return (
    <div className="flex items-center gap-3 py-2">
      <Timer className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Next auto-check · {timeLabel}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
        <div className="h-0.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-muted-foreground/40 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ProLockedWidget({ onUpgrade, checkoutLoading }: { onUpgrade: () => void; checkoutLoading: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <Lock className="h-4 w-4 text-muted-foreground/30" />
      <p className="text-[10px] font-mono text-muted-foreground/50">{t('pro.upgradeDesc')}</p>
      <button
        onClick={onUpgrade}
        disabled={checkoutLoading}
        className="text-[10px] font-mono text-primary/60 hover:text-primary transition-colors underline"
      >
        {t('pro.upgradeCta')}
      </button>
    </div>
  );
}

export default Home;
