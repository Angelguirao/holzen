import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { BtcStatus } from '@/components/BtcStatus';
import { ReflectionMessage } from '@/components/ReflectionMessage';
import { Onboarding } from '@/components/Onboarding';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, Loader2, Pause } from 'lucide-react';

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
    loading,
    error,
    newReflection,
    clearNewReflection,
    dismissMessage,
    hasOnboarded,
    completeOnboarding,
    manualTrigger,
    manualCooldownRemaining,
  } = useHolzen();

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

  return (
    <div className="space-y-10">
      {/* BTC Status */}
      <BtcStatus data={btcData} error={error} />

      <Separator />

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
              onDismiss={dismissMessage}
              companions={companions}
              companionPrefs={companionPrefs}
              severity={severity}
            />
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
                    onClick={manualTrigger}
                    className="text-xs font-mono text-muted-foreground underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <NeedAMomentButton
                  onTrigger={manualTrigger}
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
          ? `Available in ${minutes} min`
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

export default Home;
