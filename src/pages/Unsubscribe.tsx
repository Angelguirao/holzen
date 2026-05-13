import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { invokeEdge } from '@/lib/invoke-edge';
import {
  emailUnsubscribeLinkQueryKey,
  getEmailUnsubscribeLinkQueryOptions,
} from '@/lib/email-unsubscribe-query';

type ConfirmState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'already' }
  | { kind: 'error'; message: string };

export { emailUnsubscribeLinkQueryKey } from '@/lib/email-unsubscribe-query';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<ConfirmState>({ kind: 'idle' });

  const linkQuery = useQuery(getEmailUnsubscribeLinkQueryOptions(token));

  const onConfirm = async () => {
    if (!token) return;
    setConfirm({ kind: 'submitting' });
    const { data, error } = await invokeEdge<{ success?: boolean; reason?: string }>('handle-email-unsubscribe', {
      body: { token },
    });
    if (error) {
      setConfirm({ kind: 'error', message: error.message });
      return;
    }
    if (data?.success) {
      void queryClient.invalidateQueries({ queryKey: emailUnsubscribeLinkQueryKey(token) });
      setConfirm({ kind: 'success' });
      return;
    }
    if (data?.reason === 'already_unsubscribed') {
      void queryClient.invalidateQueries({ queryKey: emailUnsubscribeLinkQueryKey(token) });
      setConfirm({ kind: 'already' });
      return;
    }
    setConfirm({ kind: 'error', message: 'Unable to process request.' });
  };

  const showInvalid = !token || linkQuery.isError || linkQuery.data === 'invalid';
  const showLoading = Boolean(token) && linkQuery.isPending && confirm.kind === 'idle';
  const linkAlready = linkQuery.data === 'already' && confirm.kind === 'idle';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <p className="text-[11px] font-mono tracking-[2px] text-muted-foreground">HOLZEN</p>

        {showLoading && (
          <p className="text-sm font-mono text-muted-foreground">Checking your link…</p>
        )}

        {confirm.kind === 'idle' && linkQuery.data === 'valid' && (
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

        {confirm.kind === 'submitting' && (
          <p className="text-sm font-mono text-muted-foreground">Processing…</p>
        )}

        {confirm.kind === 'success' && (
          <>
            <h1 className="text-base font-mono text-foreground">You're unsubscribed.</h1>
            <p className="text-sm text-muted-foreground">Hold steady.</p>
          </>
        )}

        {(confirm.kind === 'already' || linkAlready) && (
          <>
            <h1 className="text-base font-mono text-foreground">Already unsubscribed</h1>
            <p className="text-sm text-muted-foreground">This email is no longer on our list.</p>
          </>
        )}

        {showInvalid && confirm.kind === 'idle' && (
          <>
            <h1 className="text-base font-mono text-foreground">Invalid or expired link</h1>
            <p className="text-sm text-muted-foreground">
              This unsubscribe link is no longer valid.
            </p>
          </>
        )}

        {confirm.kind === 'error' && (
          <>
            <h1 className="text-base font-mono text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{confirm.message}</p>
          </>
        )}
      </div>
    </div>
  );
}
