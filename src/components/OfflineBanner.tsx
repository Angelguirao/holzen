import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { processQueue } from '@/lib/offline-queue';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

async function handleQueuedAction(action: { type: string; payload: Record<string, unknown> }): Promise<boolean> {
  if (action.type === 'feedback') {
    const { error } = await supabase.functions.invoke('send-feedback', {
      body: { category: action.payload.category, message: action.payload.message },
    });
    return !error;
  }
  return false;
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = async () => {
      setOffline(false);
      // Process any queued actions
      const count = await processQueue(handleQueuedAction);
      if (count > 0) {
        toast.success(`Synced ${count} offline action${count > 1 ? 's' : ''}`, {
          description: 'Your queued items have been sent.',
        });
      }
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-muted py-1.5 text-xs font-mono text-muted-foreground border-b border-border">
      <WifiOff className="h-3 w-3" />
      You're offline
    </div>
  );
}
