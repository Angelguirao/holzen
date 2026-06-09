import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PauseDoneSummaryRowProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

/** Single label/value row inside the Done summary card. */
export function PauseDoneSummaryRow({ label, children, className }: PauseDoneSummaryRowProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 text-sm leading-5', className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right font-normal text-foreground">{children}</div>
    </div>
  );
}
