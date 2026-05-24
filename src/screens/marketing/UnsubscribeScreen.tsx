import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { useUnsubscribeScreen } from '@/screens/marketing/hooks/use-unsubscribe-screen';

export { emailUnsubscribeLinkQueryKey } from '@/screens/marketing/hooks/use-unsubscribe-screen';

export default function UnsubscribeScreen() {
  const {
    token,
    state,
    formAction,
    isPending,
    linkQuery,
    showInvalid,
    showLoading,
    linkAlready,
  } = useUnsubscribeScreen();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <p className="text-[11px] font-mono tracking-[2px] text-muted-foreground">HOLZEN</p>

        {showLoading && (
          <p className="text-sm font-mono text-muted-foreground">Checking your link…</p>
        )}

        {!showLoading && !state.success && !state.already && !state.error && linkQuery.data === 'valid' && (
          <>
            <h1 className="text-base font-mono text-foreground">Unsubscribe from emails</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You won't receive transactional emails from Holzen anymore. You can re-subscribe
              by contacting support.
            </p>
            <form action={formAction}>
              <input type="hidden" name="token" value={token ?? ''} />
              <LoadingButton type="submit" className="font-mono text-xs" loading={isPending}>
                Confirm unsubscribe
              </LoadingButton>
            </form>
          </>
        )}

        {isPending && (
          <p className="text-sm font-mono text-muted-foreground">Processing…</p>
        )}

        {state.success && (
          <>
            <h1 className="text-base font-mono text-foreground">You're unsubscribed.</h1>
            <p className="text-sm text-muted-foreground">Hold steady.</p>
          </>
        )}

        {(state.already || linkAlready) && (
          <>
            <h1 className="text-base font-mono text-foreground">Already unsubscribed</h1>
            <p className="text-sm text-muted-foreground">This email is no longer on our list.</p>
          </>
        )}

        {showInvalid && !state.success && !state.already && !state.error && !isPending && (
          <>
            <h1 className="text-base font-mono text-foreground">Invalid or expired link</h1>
            <p className="text-sm text-muted-foreground">
              This unsubscribe link is no longer valid.
            </p>
          </>
        )}

        {state.error && (
          <>
            <h1 className="text-base font-mono text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{state.error}</p>
            {token && linkQuery.data === 'valid' && (
              <form action={formAction}>
                <input type="hidden" name="token" value={token} />
                <Button type="submit" variant="outline" className="font-mono text-xs">
                  Try again
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
