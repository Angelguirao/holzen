import { Info } from 'lucide-react';
import type { Confidence } from '@/legacy/full-shell/src/lib/stats/confidence';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
  confidence: Confidence;
  sampleSize: number;
  /** Optional override label (e.g. 'last 30 completed pauses'). */
  sampleLabel?: string;
  /** Optional extra tooltip content. */
  help?: string;
}

const COLOR: Record<Confidence, string> = {
  high: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
  low: 'border-orange-500/30 bg-orange-500/10 text-orange-600',
  insufficient: 'border-border/40 bg-muted text-muted-foreground',
};

const LABEL: Record<Confidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
  insufficient: 'Not enough data',
};

/**
 * Small confidence chip paired with a sample-size tooltip. Every Stats
 * card should show one of these so readers can see "is this number
 * reliable?" at a glance.
 */
export function ConfidenceChip({ confidence, sampleSize, sampleLabel, help }: Props) {
  const tooltip =
    (help ? `${help}\n\n` : '') +
    `Sample size: ${sampleSize}${sampleLabel ? ` (${sampleLabel})` : ''}.`;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest',
              COLOR[confidence],
            )}
          >
            <Info className="h-2.5 w-2.5" aria-hidden />
            {LABEL[confidence]}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-[10px] whitespace-pre-line">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
