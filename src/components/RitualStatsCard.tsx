import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Sparkles } from 'lucide-react';

interface RitualCompletion {
  id: string;
  template: string;
  decision: string;
  duration_seconds: number | null;
  created_at: string;
}

export function RitualStatsCard() {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<RitualCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('ritual_completions' as any)
        .select('id, template, decision, duration_seconds, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);
      setCompletions((data as unknown as RitualCompletion[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const stats = useMemo(() => {
    if (!completions.length) return null;

    const total = completions.length;
    const decisionCounts: Record<string, number> = {};
    const templateCounts: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    for (const c of completions) {
      decisionCounts[c.decision] = (decisionCounts[c.decision] || 0) + 1;
      templateCounts[c.template] = (templateCounts[c.template] || 0) + 1;
      if (c.duration_seconds) {
        totalDuration += c.duration_seconds;
        durationCount++;
      }
    }

    const topDecision = Object.entries(decisionCounts).sort((a, b) => b[1] - a[1])[0];
    const topTemplate = Object.entries(templateCounts).sort((a, b) => b[1] - a[1])[0];
    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : null;

    return { total, topDecision, topTemplate, avgDuration, decisionCounts };
  }, [completions]);

  if (loading || !stats) return null;

  const decisionLabels: Record<string, string> = {
    held: 'Hold', sold: 'Sell', bought: 'Buy', nothing: 'Nothing',
  };

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-primary/60" />
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Ritual Stats</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatItem label="Completed" value={String(stats.total)} />
        <StatItem label="Avg Duration" value={stats.avgDuration ? `${stats.avgDuration}s` : '—'} />
        <StatItem label="Most Used" value={stats.topTemplate?.[0] ?? '—'} />
      </div>

      {/* Decision distribution */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono text-muted-foreground/50">Decision breakdown</p>
        <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted/50">
          {Object.entries(stats.decisionCounts).map(([key, count]) => (
            <div
              key={key}
              className={`h-full transition-all duration-500 ${
                key === 'held' ? 'bg-primary/70' :
                key === 'nothing' ? 'bg-muted-foreground/30' :
                key === 'sold' ? 'bg-destructive/60' :
                'bg-accent-foreground/40'
              }`}
              style={{ width: `${(count / stats.total) * 100}%` }}
              title={`${decisionLabels[key] || key}: ${count}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {Object.entries(stats.decisionCounts).map(([key, count]) => (
            <span key={key} className="text-[9px] font-mono text-muted-foreground/50">
              {decisionLabels[key] || key} {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-mono">{value}</p>
      <p className="text-[9px] font-mono text-muted-foreground/50">{label}</p>
    </div>
  );
}
