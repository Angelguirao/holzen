import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type CompanionFrameIconTooltipProps = {
  content: string;
  children: ReactNode;
  className?: string;
};

/** Brief companion help on icon hover/focus (Frame step rows and inline cards). */
export function CompanionFrameIconTooltip({ content, children, className }: CompanionFrameIconTooltipProps) {
  "use memo";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex shrink-0 rounded-md border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            className,
          )}
          aria-label={content}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[14rem] text-center text-xs leading-snug">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
