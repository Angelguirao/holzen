import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeadingProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

/** In-page title block (replaces removed NoxHeaderMain). */
export function PageHeading({ title, subtitle, rightSlot, className, ...props }: PageHeadingProps) {
  return (
    <header className={cn('flex items-start justify-between gap-4 border-b border-border pb-4', className)} {...props}>
      <div className="min-w-0 flex-1">
        <h1 className="font-sans text-lg font-normal leading-relaxed tracking-tight text-[#dbb266]">{title}</h1>
        {subtitle ? <p className="mt-1 text-base leading-relaxed text-muted-foreground">{subtitle}</p> : null}
      </div>
      {rightSlot ? <div className="shrink-0 pt-0.5">{rightSlot}</div> : null}
    </header>
  );
}
