import { useHolzen } from '@/hooks/use-holzen';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { BtcStatus } from '@/components/BtcStatus';
import { ThresholdSetting } from '@/components/ThresholdSetting';
import { ReflectionMessage } from '@/components/ReflectionMessage';
import { ReflectionHistory } from '@/components/ReflectionHistory';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useAuth();
  const { subscribed, loading: subLoading, checkoutLoading, startCheckout, openPortal, refresh } = useSubscription();
  const [searchParams] = useSearchParams();
  const { theme, setTheme } = useTheme();

  // Refresh subscription after checkout redirect
  useEffect(() => {
    if (searchParams.get('subscribed') === 'true') {
      refresh();
    }
  }, [searchParams, refresh]);

  const {
    threshold,
    setThreshold,
    emailNotifications,
    setEmailNotifications,
    btcData,
    message,
    context,
    loading,
    error,
    newReflection,
    clearNewReflection,
    dismissMessage,
  } = useHolzen();

  // Show toast when a new reflection is generated
  useEffect(() => {
    if (newReflection && message) {
      toast('New reflection', {
        description: message.slice(0, 80) + (message.length > 80 ? '…' : ''),
        duration: 6000,
      });
      clearNewReflection();
    }
  }, [newReflection, message, clearNewReflection]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
            Holzen
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user && (
              <button
                onClick={signOut}
                className="text-xs font-mono text-muted-foreground underline"
              >
                Sign out
              </button>
            )}
          </div>
        </div>

        {/* BTC Status */}
        <BtcStatus data={btcData} error={error} />

        <Separator />

        {/* Subscription gate */}
        {!subLoading && !subscribed ? (
          <div className="space-y-4">
            <ThresholdSetting threshold={threshold} onSet={setThreshold} />
            <Separator />
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                AI reflections require a subscription.
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
            {/* Subscribed: show reflection or threshold */}
            {message ? (
              <ReflectionMessage
                message={message}
                context={context}
                onDismiss={dismissMessage}
              />
            ) : (
              <>
                <ThresholdSetting threshold={threshold} onSet={setThreshold} />
                {loading && (
                  <p className="text-xs font-mono text-muted-foreground">
                    Generating reflection
                  </p>
                )}
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notif" className="text-xs font-mono text-muted-foreground">
                Email notifications
              </Label>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Separator />
            <button
              onClick={openPortal}
              className="text-xs font-mono text-muted-foreground underline"
            >
              Manage subscription
            </button>
            <Separator />
            <ReflectionHistory />
          </>
        )}

        <Separator />

        {/* Footer */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          When volatility crosses your threshold, you receive one message encouraging pause. Nothing more.
        </p>
      </div>
    </div>
  );
};

export default Index;
