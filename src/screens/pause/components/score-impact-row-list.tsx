import { TrendingUp, Minus } from 'lucide-react';
import type { PauseScoreImpactRow } from '@/features/pause/public-hooks';

export type ScoreImpactRowListProps = {
  impacts: PauseScoreImpactRow[];
};

/** Qualitative score impact rows (icon + label + reason). */
export function ScoreImpactRowList({ impacts }: ScoreImpactRowListProps) {
  return (
    <div className="space-y-2.5">
      {impacts.map((imp) => (
        <div key={imp.key} className="flex items-start gap-2.5">
          {imp.direction === 'up' ? (
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-nox-accent-green" />
          ) : (
            <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1 text-left text-sm leading-snug">
            <span className="font-medium text-foreground">{imp.label}</span>
            <span className="text-muted-foreground"> — {imp.reason}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
