import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import {
  DEMO_MODE_EVENT,
  DEMO_MODE_STORAGE_KEY,
  isDemoModeActive,
  setDemoMode,
} from '@/lib/stats/demo-fixture';
import { PAUSE_STATS_DATA_QUERY_KEY } from '@/lib/pause-stats-data-query';

/**
 * Admin-only toggle that swaps real pause stats for a synthetic fixture.
 * Useful when an admin account doesn't have enough real Pauses to render
 * the Journey charts. Persists in localStorage and triggers a refetch of
 * the stats query so charts update immediately.
 */
export function DemoModeToggle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState<boolean>(() => isDemoModeActive());

  useEffect(() => {
    const sync = () => setEnabled(isDemoModeActive());
    window.addEventListener(DEMO_MODE_EVENT, sync);
    window.addEventListener('storage', (e) => {
      if (e.key === DEMO_MODE_STORAGE_KEY) sync();
    });
    return () => {
      window.removeEventListener(DEMO_MODE_EVENT, sync);
    };
  }, []);

  const handleToggle = (next: boolean) => {
    setDemoMode(next);
    setEnabled(next);
    if (user) {
      queryClient.invalidateQueries({ queryKey: PAUSE_STATS_DATA_QUERY_KEY(user.id) });
    }
  };

  return (
    <div className="rounded-md border border-border/50 bg-muted/20 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Sparkles className="h-4 w-4 mt-0.5 text-muted-foreground" aria-hidden />
        <div className="flex-1 space-y-1">
          <Label htmlFor="demo-mode-toggle" className="text-sm font-medium">
            Demo data mode
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Replace your real Pause stats with a synthetic fixture (~45 Pauses
            spread over 75 days). Useful for previewing Journey charts when
            your account has too little real data. No database writes —
            applies to this browser only.
          </p>
        </div>
        <Switch
          id="demo-mode-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
        />
      </div>
      {enabled && (
        <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500/80">
          Demo data active — Journey screens show synthetic Pauses
        </p>
      )}
    </div>
  );
}
