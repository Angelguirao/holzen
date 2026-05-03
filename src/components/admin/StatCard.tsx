import type { LucideIcon } from 'lucide-react';

export interface TrendInfo {
  direction: 'up' | 'down' | 'flat';
  label: string;
}

export function StatCard({ icon: Icon, title, value, subtitle, alert, trend }: {
  icon: LucideIcon;
  title: string;
  value: string;
  subtitle?: string;
  alert?: boolean;
  trend?: TrendInfo;
}) {
  const trendColor = trend
    ? trend.direction === 'flat'
      ? 'text-muted-foreground/40'
      : trend.direction === 'up'
        ? 'text-nox-accent-green'
        : 'text-destructive'
    : '';
  const trendArrow = trend
    ? trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '—'
    : '';

  return (
    <div className={`rounded-xl border px-4 py-3 space-y-1 ${alert ? 'border-destructive/40 bg-destructive/10' : 'border-border/30 bg-card/20'}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${alert ? 'text-destructive' : 'text-muted-foreground/60'}`} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">{title}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <p className={`text-lg font-mono ${alert ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
        {trend && (
          <span className={`text-[9px] font-mono ${trendColor}`}>
            {trendArrow} {trend.label}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[10px] text-muted-foreground/60">{subtitle}</p>}
    </div>
  );
}
