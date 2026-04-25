import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  trend: 'improving' | 'declining' | 'stable' | null;
}

/**
 * Minimal trend indicator shared by Skill Overview bars and individual
 * deep-dive cards. Stays silent (renders nothing) when the input is null,
 * which callers use to signal "no trend yet" rather than "stable".
 */
export function TrendChip({ trend }: Props) {
  if (trend === null) return null;
  const Icon = trend === 'improving' ? ArrowUpRight : trend === 'declining' ? ArrowDownRight : Minus;
  const color =
    trend === 'improving'
      ? 'text-emerald-500'
      : trend === 'declining'
        ? 'text-destructive/80'
        : 'text-muted-foreground';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-mono uppercase tracking-widest',
        color,
      )}
      aria-label={`Trend: ${trend}`}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden />
      {trend}
    </span>
  );
}
