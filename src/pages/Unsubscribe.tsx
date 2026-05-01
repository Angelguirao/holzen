import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { invokeEdge } from '@/lib/invoke-edge';

type State =
  | { kind: 'loading' }
  | { kind: 'valid' }
  | { kind: 'already' }
  | { kind: 'invalid' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid' });
      return;
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    fetch(
      `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
      { headers: { apikey: anonKey } },
    )
      .then(async (res) => {
        const data = await res.json();
        if (data.valid) setState({ kind: 'valid' });
        else if (data.reason === 'already_unsubscribed') setState({ kind: 'already' });
        else setState({ kind: 'invalid' });
      })
      .catch(() => setState({ kind: 'invalid' }));
  }, [token]);

  const onConfirm = async () => {
    if (!token) return;
    setState({ kind: 'submitting' });
    const { data, error } = await invokeEdge<{ success?: boolean; reason?: string }>('handle-email-unsubscribe', {
      body: { token },
    });
    if (error) {
      setState({ kind: 'error', message: error.message });
      return;
    }
    if (data?.success) setState({ kind: 'success' });
    else if (data?.reason === 'already_unsubscribed') setState({ kind: 'already' });
    else setState({ kind: 'error', message: 'Unable to process request.' });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <p className="text-[11px] font-mono tracking-[2px] text-muted-foreground">HOLZEN</p>

        {state.kind === 'loading' && (
          <p className="text-sm font-mono text-muted-foreground">Checking your link…</p>
        )}

        {state.kind === 'valid' && (
          <>
            <h1 className="text-base font-mono text-foreground">Unsubscribe from emails</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You won't receive transactional emails from Holzen anymore. You can re-subscribe
              by contacting support.
            </p>
            <Button onClick={onConfirm} className="font-mono text-xs">
              Confirm unsubscribe
            </Button>
          </>
        )}

        {state.kind === 'submitting' && (
          <p className="text-sm font-mono text-muted-foreground">Processing…</p>
        )}

        {state.kind === 'success' && (
          <>
            <h1 className="text-base font-mono text-foreground">You're unsubscribed.</h1>
            <p className="text-sm text-muted-foreground">Hold steady.</p>
          </>
        )}

        {state.kind === 'already' && (
          <>
            <h1 className="text-base font-mono text-foreground">Already unsubscribed</h1>
            <p className="text-sm text-muted-foreground">This email is no longer on our list.</p>
          </>
        )}

        {state.kind === 'invalid' && (
          <>
            <h1 className="text-base font-mono text-foreground">Invalid or expired link</h1>
            <p className="text-sm text-muted-foreground">
              This unsubscribe link is no longer valid.
            </p>
          </>
        )}

        {state.kind === 'error' && (
          <>
            <h1 className="text-base font-mono text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{state.message}</p>
          </>
        )}
      </div>
    </div>
  );
}
