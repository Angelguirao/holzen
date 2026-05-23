import { useState, useEffect, useCallback, useRef } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { processQueue } from '@/lib/offline-queue';
import { pingSupabaseReachability } from '@/lib/supabase-reachability';
import { sendFeedback } from '@/features/user/public-rpc';
import { toast } from 'sonner';

async function handleQueuedAction(action: { type: string; payload: Record<string, unknown> }): Promise<boolean> {
  if (action.type === 'feedback') {
    const { error } = await sendFeedback(action.payload);
    return !error;
  }
  return false;
}

/** Two failed health checks (with a short gap) before showing the degraded state. */
async function runReachabilityCheck(): Promise<boolean> {
  if (!navigator.onLine) return true;
  const first = await pingSupabaseReachability();
  if (first) return true;
  await new Promise((r) => setTimeout(r, 8_000));
  if (!navigator.onLine) return true;
  return pingSupabaseReachability();
}

export function OfflineBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(!navigator.onLine);
  const [reachabilityFailed, setReachabilityFailed] = useState(false);
  const alive = useRef(true);

  const checkReachability = useCallback(async () => {
    if (!alive.current || !navigator.onLine) return;
    const ok = await runReachabilityCheck();
    if (!alive.current) return;
    setReachabilityFailed(!ok);
  }, []);

  useEffect(() => {
    alive.current = true;

    const goOffline = () => {
      setOffline(true);
      setReachabilityFailed(false);
    };

    const goOnline = async () => {
      setOffline(false);
      setReachabilityFailed(false);
      const count = await processQueue(handleQueuedAction);
      if (count > 0) {
        toast.success(`Synced ${count} offline action${count > 1 ? 's' : ''}`, {
          description: 'Your queued items have been sent.',
        });
      }
      window.setTimeout(() => void checkReachability(), 2_500);
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    const startupId = window.setTimeout(() => void checkReachability(), 3_500);
    const intervalId = window.setInterval(() => {
      if (navigator.onLine) void checkReachability();
    }, 90_000);

    return () => {
      alive.current = false;
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      window.clearTimeout(startupId);
      window.clearInterval(intervalId);
    };
  }, [checkReachability]);

  if (offline) {
    return (
      <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-muted py-1.5 text-xs font-mono text-muted-foreground border-b border-border">
        <WifiOff className="h-3 w-3 shrink-0" aria-hidden />
        {t('common.offlineBanner')}
      </div>
    );
  }

  if (reachabilityFailed) {
    return (
      <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-muted py-1.5 px-3 text-xs font-mono text-muted-foreground border-b border-border text-center">
        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
        <span>{t('common.connectivityDegraded')}</span>
      </div>
    );
  }

  return null;
}
