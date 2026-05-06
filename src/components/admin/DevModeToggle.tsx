import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

function readLocalDevMode(): boolean {
  try {
    return localStorage.getItem('holzen_dev_mode') === 'true';
  } catch {
    return false;
  }
}

export function adminDevModeSettingQueryKey(userId: string) {
  return ['admin', 'dev-mode-setting', userId] as const;
}

async function fetchDevModeFromAnalytics(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('metadata')
    .eq('user_id', userId)
    .eq('event', 'dev_mode_setting')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data?.length) {
    return readLocalDevMode();
  }
  const metadata = data[0].metadata as { enabled?: boolean } | null;
  const dbValue = metadata?.enabled === true;
  try {
    if (dbValue) localStorage.setItem('holzen_dev_mode', 'true');
    else localStorage.removeItem('holzen_dev_mode');
  } catch {
    /* ignore */
  }
  return dbValue;
}

export function DevModeToggle() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [localOnlyMode, setLocalOnlyMode] = useState(() => readLocalDevMode());

  useEffect(() => {
    if (!userId) {
      setLocalOnlyMode(readLocalDevMode());
    }
  }, [userId]);

  const { data: queryDevMode } = useQuery({
    queryKey: userId ? adminDevModeSettingQueryKey(userId) : ['admin', 'dev-mode-setting', 'none'],
    queryFn: () => fetchDevModeFromAnalytics(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const devMode = userId ? (queryDevMode ?? readLocalDevMode()) : localOnlyMode;

  const toggle = async () => {
    const next = !devMode;
    if (userId) {
      queryClient.setQueryData(adminDevModeSettingQueryKey(userId), next);
    } else {
      setLocalOnlyMode(next);
    }
    setSyncing(true);
    try {
      if (next) localStorage.setItem('holzen_dev_mode', 'true');
      else localStorage.removeItem('holzen_dev_mode');
    } catch {
      /* ignore */
    }
    try {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (u) {
        await supabase.from('analytics_events').insert({
          user_id: u.id,
          event: 'dev_mode_setting',
          metadata: { enabled: next },
        });
      }
    } catch {
      /* non-critical */
    }
    setSyncing(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">Dev Tools</p>
      <button
        onClick={toggle}
        className={`w-full rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${
          devMode
            ? 'border-secondary/60 bg-secondary/30'
            : 'border-border/15 bg-card/10 hover:bg-card/20'
        }`}
      >
        <Zap className={`h-3.5 w-3.5 ${devMode ? 'text-secondary-foreground' : 'text-muted-foreground/30'}`} />
        <div className="flex-1 text-left">
          <p className={`text-[10px] font-mono ${devMode ? 'text-secondary-foreground' : 'text-foreground/60'}`}>
            Rapid Testing Mode {syncing && '…'}
          </p>
          <p className="text-[9px] text-muted-foreground/40">
            {devMode ? '5s cooldown between pauses (active)' : '1h cooldown between manual pauses (normal)'}
          </p>
        </div>
        <span className={`text-[9px] font-mono ${devMode ? 'text-secondary-foreground/80' : 'text-muted-foreground/30'}`}>
          {devMode ? 'ON' : 'OFF'}
        </span>
      </button>
      {devMode && (
        <p className="text-[9px] text-secondary-foreground/60 px-1">
          ⚡ Generate pause sessions rapidly to gather data. Each session costs ~$0.01-0.05 in API calls. Disable when done testing.
        </p>
      )}
    </div>
  );
}
