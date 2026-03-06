import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { BtcStatus } from '@/components/BtcStatus';
import { ThresholdSetting } from '@/components/ThresholdSetting';
import { ReflectionMessage } from '@/components/ReflectionMessage';
import { Onboarding } from '@/components/Onboarding';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const Home = () => {
  const { subscribed, loading: subLoading, trialRemaining, checkoutLoading, startCheckout, refresh } = useSubscription();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('subscribed') === 'true') {
      refresh();
    }
  }, [searchParams, refresh]);

  const {
    threshold,
    setThreshold,
    btcData,
    message,
    context,
    loading,
    error,
    newReflection,
    clearNewReflection,
    dismissMessage,
    hasOnboarded,
    completeOnboarding,
    manualTrigger,
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
        <div className="space-y-4">
          <ThresholdSetting threshold={threshold} onSet={setThreshold} />
          <Separator />
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
        </div>
      ) : subLoading ? (
        <p className="text-xs font-mono text-muted-foreground">Loading</p>
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
            />
          ) : (
            <>
              <ThresholdSetting threshold={threshold} onSet={setThreshold} />
              {loading ? (
                <p className="text-xs font-mono text-muted-foreground">
                  Generating reflection
                </p>
              ) : (
                <button
                  onClick={manualTrigger}
                  className="text-xs font-mono text-muted-foreground underline"
                >
                  Generate reflection now
                </button>
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

export default Home;
