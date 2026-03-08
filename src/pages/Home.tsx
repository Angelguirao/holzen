import { useHolzen } from '@/hooks/use-holzen';
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
import { AlertCircle, Loader2, Pause, Pin, Timer, Circle, Sparkles, Waves, RotateCcw } from 'lucide-react';
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

const WIDGET_TITLES: Record<WidgetId, string> = {
  'btc-status': 'Market',
  'hold-goal': 'Goal',
  'reflection': 'Reflection',
  'night': 'Evening',
  'letter': 'Letter',
  'actions': 'Practice',
};

interface PinnedReflection {
  id: string;
  message: string;
  context: string | null;
  haiku: string | null;
  learning_title: string | null;
  learning_body: string | null;
}

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribed, loading: subLoading, trialRemaining, checkoutLoading, startCheckout, refresh } = useSubscription();
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
  } = useHolzen();

  const { reflection: nightReflection, dismiss: dismissNight } = useNightReflection();

  const [showOutcome, setShowOutcome] = useState(false);
  const [showVoid, setShowVoid] = useState(false);
  const [showRitual, setShowRitual] = useState(false);
  const [outcomeReflectionId, setOutcomeReflectionId] = useState<string | null>(null);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [priceHidden, setPriceHidden] = useState(() => localStorage.getItem('holzen_hide_price') === 'true');
  const [zenMode] = useState(() => localStorage.getItem('holzen_zen_mode') === 'true');
  const [pinnedReflection, setPinnedReflection] = useState<PinnedReflection | null>(null);
  const prefersReducedMotion = useReducedMotion();

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

  const togglePriceHidden = useCallback(() => {
    setPriceHidden(prev => {
      const next = !prev;
      localStorage.setItem('holzen_hide_price', String(next));
      return next;
    });
  }, []);

  const handleNeedAMoment = () => {
    if (manualCooldownRemaining() > 0) return;
    setShowMoodCheck(true);
  };

  const handleMoodSelected = (mood: MoodValue) => {
    setShowMoodCheck(false);
    manualTrigger(mood);
  };

  const handleMoodSkipped = () => {
    setShowMoodCheck(false);
    manualTrigger();
  };

  const handleDismiss = () => {
    setOutcomeReflectionId(lastReflectionId);
    dismissMessage();
    setShowOutcome(true);
  };

  const handleOutcomeComplete = () => {
    setShowOutcome(false);
    setOutcomeReflectionId(null);
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

  if (!hasOnboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const hasAccess = subscribed || (trialRemaining !== undefined && trialRemaining > 0);

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
                <p className="text-xs font-mono">Generating reflection</p>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </motion.div>
          ) : (
            <motion.div key="zen-empty" variants={zenVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-6 text-center">
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">No active reflection.</p>
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
              <BtcStatus data={btcData} error={error} hidden={priceHidden} onToggleHidden={togglePriceHidden} />
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
            <HoldGoalWidget currentPrice={btcData?.currentPrice} />
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
                    You've used all 3 free reflections. Subscribe to continue.
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    $3 per month · Cancel anytime
                  </p>
                  <Button onClick={startCheckout} disabled={checkoutLoading} className="w-full font-mono text-xs">
                    {checkoutLoading ? 'Opening checkout…' : 'Subscribe'}
                  </Button>
                </div>
              ) : subLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  {!subscribed && trialRemaining !== undefined && trialRemaining > 0 && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {trialRemaining} free reflection{trialRemaining !== 1 ? 's' : ''} remaining
                    </p>
                  )}

                  {message ? (
                    <div className="space-y-4">
                      <ReflectionMessage
                        message={message} context={context} onDismiss={handleDismiss}
                        companions={companions} companionPrefs={companionPrefs}
                        severity={severity} reflectionId={lastReflectionId}
                      />
                      <button
                        onClick={() => setShowRitual(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        <Sparkles className="h-3 w-3 text-primary/60" />
                        <span className="text-[10px] font-mono text-primary/60 tracking-[0.15em] uppercase">
                          Start ritual before deciding
                        </span>
                      </button>
                      {lastReflectionId && <ReflectionComparison reflectionId={lastReflectionId} />}
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
                            <p className="text-xs font-mono">Generating reflection…</p>
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
                                ? 'Could not reach price data'
                                : error.includes('generate') || error.includes('reflect')
                                ? 'AI reflection unavailable right now'
                                : 'Something went wrong'}
                            </p>
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground/60 leading-relaxed">
                            {error.includes('fetch') || error.includes('network') || error.includes('Failed to fetch')
                              ? 'Check your internet connection. Price data comes from CoinGecko and may be temporarily unavailable.'
                              : error.includes('generate') || error.includes('reflect')
                              ? 'The AI service is temporarily unavailable. Your settings and data are safe — try again in a moment.'
                              : 'An unexpected error occurred. Your data is safe.'}
                          </p>
                          <button onClick={() => manualTrigger()} className="text-xs font-mono text-primary underline">
                            Try again
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {pinnedReflection && (
                            <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Pin className="h-2.5 w-2.5" />
                                  <span className="text-[10px] font-mono uppercase tracking-wider">Pinned</span>
                                </div>
                                <button onClick={unpinReflection} className="text-[10px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors">
                                  Unpin
                                </button>
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
        if (!nightReflection) return null;
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
        if (!hasAccess || !btcData) return null;
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
                onClick={() => setShowRitual(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors duration-300"
              >
                <Sparkles className="h-3 w-3 text-primary/40" />
                <span className="text-[10px] font-mono text-primary/40 tracking-[0.2em] uppercase">
                  Start a ritual
                </span>
              </button>
              <button
                onClick={() => setShowVoid(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors duration-500"
              >
                <Circle className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[10px] font-mono text-muted-foreground/40 tracking-[0.2em] uppercase">
                  Enter the void
                </span>
              </button>
              <button
                onClick={() => navigate('/ambient')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors duration-500"
              >
                <Waves className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[10px] font-mono text-muted-foreground/40 tracking-[0.2em] uppercase">
                  Ambient mode
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
    <div className="space-y-4">
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
            Reset
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

      <p className="text-xs text-muted-foreground leading-relaxed">
        When Bitcoin moves, we'll help you pause before you act.
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
      <Button
        onClick={onTrigger}
        disabled={inCooldown || loading}
        variant="outline"
        className="w-full font-mono text-xs gap-2"
      >
        <Pause className="h-3.5 w-3.5" />
        {loading ? 'Generating…' : inCooldown
          ? `Manual reflection in ${minutes} min`
          : 'I need a moment'}
      </Button>
      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        {inCooldown
          ? 'Take this time to breathe. The next reflection will be here when you need it.'
          : 'Request a reflection anytime — no threshold required.'}
      </p>
    </div>
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

export default Home;
