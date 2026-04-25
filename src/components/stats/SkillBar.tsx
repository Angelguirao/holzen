import { motion } from 'framer-motion';
import { TrendChip } from './TrendChip';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: number | null;
  trend?: 'improving' | 'declining' | 'stable' | null;
  /** Render a 'not configured' CTA row instead of a bar. Used by Alignment when no hold goal. */
  notConfigured?: { message: string; ctaLabel?: string; onCta?: () => void };
}

/**
 * A single 0-100 skill bar with label + optional trend chip. When
 * `notConfigured` is provided the bar is replaced by a plain text row
 * and optional CTA — used by the Alignment skill when no hold goal
 * exists, so the UI never shows a synthetic score (per the target
 * model in docs/systems/stats-system.md).
 */
export function SkillBar({ label, value, trend = null, notConfigured }: Props) {
  if (notConfigured) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-widest text-foreground">
            {label}
          </p>
          {notConfigured.ctaLabel && notConfigured.onCta && (
            <button
              type="button"
              onClick={notConfigured.onCta}
              className="text-[10px] font-medium text-primary underline-offset-2 hover:underline"
            >
              {notConfigured.ctaLabel}
            </button>
          )}
        </div>
        <p className="text-xs italic text-muted-foreground">{notConfigured.message}</p>
      </div>
    );
  }

  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <p className={cn('text-xs font-mono tabular-nums', value == null && 'text-muted-foreground')}>
            {value == null ? '—' : Math.round(value)}
          </p>
          <TrendChip trend={trend} />
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
