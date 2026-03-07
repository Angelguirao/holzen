import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { BtcStatus } from '@/components/BtcStatus';
import { BtcChart } from '@/components/BtcChart';
import { HomeStreaks } from '@/components/HomeStreaks';
import { NightReflectionCard } from '@/components/NightReflectionCard';
import { HolzenScoreCard } from '@/components/HolzenScoreCard';
import { LetterToFutureSelf } from '@/components/LetterToFutureSelf';
import { ReflectionMessage } from '@/components/ReflectionMessage';
import { OutcomePrompt } from '@/components/OutcomePrompt';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';
import { Onboarding } from '@/components/Onboarding';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, Loader2, Pause, Timer } from 'lucide-react';

const Home = () => {
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
    streakFreezeDates,
    useStreakFreeze,
  } = useHolzen();

  const [showOutcome, setShowOutcome] = useState(false);
  const [outcomeReflectionId, setOutcomeReflectionId] = useState<string | null>(null);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [priceHidden, setPriceHidden] = useState(() => localStorage.getItem('holzen_hide_price') === 'true');
  const [zenMode] = useState(() => localStorage.getItem('holzen_zen_mode') === 'true');

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
      toast('New reflection', {
        description: message.slice(0, 80) + (message.length > 80 ? '…' : ''),
        duration: 6000,
      });
      clearNewReflection();
    }
  }, [newReflection, message, clearNewReflection]);

  useEffect(() => {
    document.title = 'Holzen — Home';
    return () => { document.title = 'Holzen — Pause before you act'; };
  }, []);

  if (!hasOnboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const hasAccess = subscribed || (trialRemaining !== undefined && trialRemaining > 0);

  if (zenMode) {
    return (
      <div className="space-y-10 min-h-[60vh] flex flex-col justify-center">
        {message ? (
          <ReflectionMessage
            message={message}
            context={context}
            onDismiss={handleDismiss}
            companions={companions}
            companionPrefs={{ breathing: companionPrefs.breathing, haiku: false, learning: false }}
            severity={severity}
            reflectionId={lastReflectionId}
          />
        ) : showOutcome && outcomeReflectionId ? (
          <OutcomePrompt
            reflectionId={outcomeReflectionId}
            onComplete={handleOutcomeComplete}
          />
        ) : showMoodCheck ? (
          <MoodCheck onSelect={handleMoodSelected} onSkip={handleMoodSkipped} />
        ) : loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <p className="text-xs font-mono">Generating reflection</p>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              No active reflection.
            </p>
            {hasAccess && (
              <NeedAMomentButton
                onTrigger={handleNeedAMoment}
                cooldownRemaining={manualCooldownRemaining}
                loading={loading}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* BTC Status */}
      <BtcStatus data={btcData} error={error} hidden={priceHidden} onToggleHidden={togglePriceHidden} />

      {/* 7-day chart */}
      <BtcChart hidden={priceHidden} />

      {/* Streaks & Stats */}
      <HomeStreaks streakFreezeDates={streakFreezeDates} onUseFreeze={useStreakFreeze} />

      {/* Holzen Score */}
      <HolzenScoreCard />

      {/* Night Reflection */}
      <NightReflectionCard />

      {/* Letter to Future Self */}
      <LetterToFutureSelf
        currentPrice={btcData?.currentPrice ?? null}
        changePercent={btcData?.changePercent ?? null}
      />

      <Separator />

      {/* Auto-trigger cooldown countdown */}
      <AutoCooldownIndicator
        cooldownRemaining={autoCooldownRemaining}
        cooldownHours={cooldownHours}
      />

      {/* Subscription / trial gate */}
      {!subLoading && !hasAccess ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You've used all 3 free reflections. Subscribe to continue.
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            $3 per month. Cancel anytime.
          </p>
          <Button
            onClick={startCheckout}
            disabled={checkoutLoading}
            className="w-full font-mono text-xs"
          >
            {checkoutLoading ? 'Opening checkout' : 'Subscribe'}
          </Button>
        </div>
      ) : subLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : (
        <>
          {/* Trial badge */}
          {!subscribed && trialRemaining !== undefined && trialRemaining > 0 && (
            <p className="text-xs font-mono text-muted-foreground">
              {trialRemaining} free reflection{trialRemaining !== 1 ? 's' : ''} remaining
            </p>
          )}

          {message ? (
            <ReflectionMessage
              message={message}
              context={context}
              onDismiss={handleDismiss}
              companions={companions}
              companionPrefs={companionPrefs}
              severity={severity}
              reflectionId={lastReflectionId}
            />

          ) : showOutcome && outcomeReflectionId ? (
            <OutcomePrompt
              reflectionId={outcomeReflectionId}
              onComplete={handleOutcomeComplete}
            />
          ) : showMoodCheck ? (
            <MoodCheck onSelect={handleMoodSelected} onSkip={handleMoodSkipped} />
          ) : (
            <>
              {loading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <p className="text-xs font-mono">Generating reflection</p>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : error && !btcData ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <p className="text-xs font-mono">Something went wrong</p>
                  </div>
                  <button
                    onClick={() => manualTrigger()}
                    className="text-xs font-mono text-muted-foreground underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <NeedAMomentButton
                  onTrigger={handleNeedAMoment}
                  cooldownRemaining={manualCooldownRemaining}
                  loading={loading}
                />
              )}
            </>
          )}
        </>
      )}

      <Separator />

      <p className="text-xs text-muted-foreground leading-relaxed">
        When volatility crosses your threshold, you receive one message encouraging pause. Nothing more.
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
        {loading ? 'Generating...' : inCooldown
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
    ? `${hours}h ${minutes}m`
    : `${minutes}m`;

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
