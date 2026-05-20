import { Wind, Heart, BookOpen, Compass, Target, ExternalLink, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { PauseScienceStepConfig } from '@/screens/pause/lib/pause-science-steps';

const STEP_ICONS: Record<PauseScienceStepConfig['key'], LucideIcon> = {
  feel: Heart,
  breathe: Wind,
  reflect: BookOpen,
  frame: Compass,
  breath2: Wind,
  decide: Target,
};

export type PauseScienceStepRowProps = {
  step: PauseScienceStepConfig;
  highlighted: boolean;
};

/** One ritual step block in the “science behind the pause” sheet. */
export function PauseScienceStepRow({ step, highlighted }: PauseScienceStepRowProps) {
  const { t } = useTranslation();
  const Icon = STEP_ICONS[step.key];

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border border-transparent p-2 transition-colors',
        highlighted && 'border-border/60 bg-muted/40',
      )}
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/60">
        <Icon className="h-3 w-3 text-muted-foreground/60" />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">{t(`pauseScience.${step.key}`)}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t(`pauseScience.${step.key}Desc`)}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {step.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1 break-words text-xs text-nox-text-link underline-offset-2 transition-colors hover:text-nox-text-link/80 hover:underline"
            >
              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              {source.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
