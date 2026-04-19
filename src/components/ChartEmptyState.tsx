import { forwardRef } from 'react';
import { BarChart3 } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  current?: number;
  needed?: number;
}

export const ChartEmptyState = forwardRef<HTMLDivElement, Props>(function ChartEmptyState({ title, message, current, needed }, ref) {
  return (
    <div ref={ref} className="rounded-md border border-border/60 bg-muted/30 px-4 py-6 space-y-2 text-center">
      <BarChart3 className="h-4 w-4 mx-auto text-muted-foreground/30" />
      <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground/50">
        {title}
      </p>
      <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-[220px] mx-auto">
        {message}
      </p>
      {current !== undefined && needed !== undefined && (
        <div className="pt-1 space-y-1">
          <div className="h-1 w-24 mx-auto rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min((current / needed) * 100, 100)}%`, backgroundColor: '#C1CBD7' }}
            />
          </div>
          <p className="text-[9px] font-mono text-muted-foreground/40">
            {current} / {needed}
          </p>
        </div>
      )}
    </div>
  );
});