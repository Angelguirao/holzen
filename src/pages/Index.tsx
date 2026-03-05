import { useHolzen } from '@/hooks/use-holzen';
import { useAuth } from '@/hooks/use-auth';
import { BtcStatus } from '@/components/BtcStatus';
import { ThresholdSetting } from '@/components/ThresholdSetting';
import { ReflectionMessage } from '@/components/ReflectionMessage';
import { Separator } from '@/components/ui/separator';

const Index = () => {
  const { user, signOut } = useAuth();
  const {
    threshold,
    setThreshold,
    btcData,
    message,
    context,
    loading,
    error,
    dismissMessage,
  } = useHolzen();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
            Holzen
          </h1>
          {user && (
            <button
              onClick={signOut}
              className="text-xs font-mono text-muted-foreground underline"
            >
              Sign out
            </button>
          )}
        </div>

        {/* BTC Status */}
        <BtcStatus data={btcData} error={error} />

        <Separator />

        {/* Reflection Message or Threshold Setting */}
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

        {/* Footer */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          When volatility crosses your threshold, you receive one message encouraging pause. Nothing more.
        </p>
      </div>
    </div>
  );
};

export default Index;
