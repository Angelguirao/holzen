import { useState, useEffect, useMemo, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Sparkles, ChevronDown, Zap, Timer, Layers } from 'lucide-react';

interface RitualCompletion {
  id: string;
  template: string;
  decision: string;
  duration_seconds: number | null;
  created_at: string;
}

const TEMPLATE_META: Record<string, { labelKey: string; icon: typeof Zap }> = {
  quick: { labelKey: 'ritualStats.templates.quick', icon: Zap },
  standard: { labelKey: 'ritualStats.templates.standard', icon: Timer },
  deep: { labelKey: 'ritualStats.templates.deep', icon: Layers },
};

interface TemplateStats {
  template: string;
  labelKey: string;
  count: number;
  holdRate: number | null;
  avgDuration: number | null;
  decisions: Record<string, number>;
}

export function RitualStatsCard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [completions, setCompletions] = useState<RitualCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

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

  const { stats, templateStats, bestTemplate } = useMemo(() => {
    if (!completions.length) return { stats: null, templateStats: [], bestTemplate: null };

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

    const byTemplate = new Map<string, RitualCompletion[]>();
    for (const c of completions) {
      const arr = byTemplate.get(c.template) || [];
      arr.push(c);
      byTemplate.set(c.template, arr);
    }

    const templateStats: TemplateStats[] = Array.from(byTemplate.entries())
      .map(([template, items]) => {
        const decisions: Record<string, number> = {};
        let dur = 0;
        let durCount = 0;
        for (const c of items) {
          decisions[c.decision] = (decisions[c.decision] || 0) + 1;
          if (c.duration_seconds) { dur += c.duration_seconds; durCount++; }
        }
        const held = (decisions['held'] || 0) + (decisions['nothing'] || 0);
        const holdRate = items.length > 0 ? held / items.length : null;
        const meta = TEMPLATE_META[template];
        return {
          template,
          labelKey: meta?.labelKey ?? template,
          count: items.length,
          holdRate,
          avgDuration: durCount > 0 ? Math.round(dur / durCount) : null,
          decisions,
        };
      })
      .sort((a, b) => (b.holdRate ?? 0) - (a.holdRate ?? 0));

    const eligible = templateStats.filter((t) => t.count >= 2);
    const bestTemplate = eligible.length > 0 ? eligible[0] : null;

    return {
      stats: { total, topDecision, topTemplate, avgDuration, decisionCounts },
      templateStats,
      bestTemplate,
    };
  }, [completions]);

  if (loading || !stats) return null;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-primary/60" />
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">{t('ritualStats.title')}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatItem label={t('ritualStats.completed')} value={String(stats.total)} />
        <StatItem label={t('ritualStats.avgDuration')} value={stats.avgDuration ? `${stats.avgDuration}s` : '—'} />
        <StatItem label={t('ritualStats.mostUsed')} value={stats.topTemplate?.[0] ?? '—'} />
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-mono text-muted-foreground/50">{t('ritualStats.decisionBreakdown')}</p>
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
              title={`${t(`outcome.${key}`, key)}: ${count}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {Object.entries(stats.decisionCounts).map(([key, count]) => (
            <span key={key} className="text-[9px] font-mono text-muted-foreground/50">
              {t(`outcome.${key}`, key)} {count}
            </span>
          ))}
        </div>
      </div>

      {bestTemplate && templateStats.length > 1 && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('ritualStats.bestTemplateInsight', {
            template: t(bestTemplate.labelKey),
            rate: Math.round((bestTemplate.holdRate ?? 0) * 100),
          })}
          {bestTemplate.avgDuration && (
            <span className="text-muted-foreground/50"> · {t('ritualStats.avgSuffix', { seconds: bestTemplate.avgDuration })}</span>
          )}
        </p>
      )}

      {templateStats.length > 1 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
            {t('ritualStats.templateEffectiveness')}
          </button>

          {showBreakdown && (
            <div className="space-y-2.5 pt-1 border-t border-border/30">
              {templateStats.map((ts) => {
                const Icon = TEMPLATE_META[ts.template]?.icon ?? Sparkles;
                return (
                  <div key={ts.template} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon className="h-2.5 w-2.5 text-muted-foreground/50" />
                        {t(ts.labelKey)}
                        <span className="text-muted-foreground/40">({ts.count})</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {ts.avgDuration && (
                          <span className="text-muted-foreground/40">{ts.avgDuration}s avg</span>
                        )}
                        <span className={ts.holdRate !== null && ts.holdRate >= 0.7 ? 'text-primary' : 'text-muted-foreground'}>
                          {ts.holdRate !== null ? `${Math.round(ts.holdRate * 100)}% ${t('ritualStats.held')}` : '—'}
                        </span>
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/50 transition-all duration-700 ease-out"
                        style={{ width: `${(ts.holdRate ?? 0) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const StatItem = forwardRef<HTMLDivElement, { label: string; value: string }>(
  ({ label, value }, ref) => (
    <div ref={ref} className="text-center">
      <p className="text-sm font-mono">{value}</p>
      <p className="text-[9px] font-mono text-muted-foreground/50">{label}</p>
    </div>
  )
);
StatItem.displayName = 'StatItem';
