import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Check, Sparkles } from 'lucide-react';

export function RitualCooldownBanner() {
  const { user } = useAuth();
  const [lastRitual, setLastRitual] = useState<{ decision: string; created_at: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('ritual_completions' as any)
        .select('decision, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setLastRitual(data as any);
    })();
  }, [user]);

  if (!lastRitual) return null;

  // Show banner for 2 hours after ritual completion
  const elapsed = Date.now() - new Date(lastRitual.created_at).getTime();
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  if (elapsed > TWO_HOURS) return null;

  const decisionLabels: Record<string, string> = {
    held: 'hold', sold: 'sell', bought: 'buy', nothing: 'do nothing',
  };
  const label = decisionLabels[lastRitual.decision] || lastRitual.decision;

  return (
    <div className="flex items-center gap-2.5 rounded-md border border-primary/15 bg-primary/5 px-3 py-2.5">
      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Check className="h-2.5 w-2.5 text-primary" />
      </div>
      <p className="text-[10px] font-mono text-primary/60 leading-relaxed">
        You decided to <span className="text-primary/90 font-medium">{label}</span> — sit with it.
      </p>
    </div>
  );
}
