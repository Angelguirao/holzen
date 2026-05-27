import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CompanionError } from './CompanionError';
import {
  CompanionOpenFullViewButton,
} from '@/screens/pause/components/companion/companion-open-full-view-button';

export type GroundingNudgePayload = {
  title: string;
  body: string;
  citation: string;
  url: string;
};

export type GroundingDisplayVariant = 'default' | 'frame';

export type GroundingDisplayProps = {
  title: string;
  body: string;
  nudge?: GroundingNudgePayload | null;
  nudgeLoading?: boolean;
  nudgeError?: boolean;
  onRetry?: () => void;
  variant?: GroundingDisplayVariant;
  pauseInstanceId?: string | null;
};

function truncateExcerpt(body: string, maxChars = 220): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const slice = trimmed.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > maxChars * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

/** Grounding / bias nudge body — frame variant matches Figma title → body → citation. */
export function GroundingDisplay({
  title,
  body,
  nudge,
  nudgeLoading = false,
  nudgeError = false,
  onRetry,
  variant = 'default',
  pauseInstanceId = null,
}: GroundingDisplayProps) {
  "use memo";
  const { t } = useTranslation();
  const isFrame = variant === 'frame';
  const hasNudgeSystem = nudge !== undefined || nudgeLoading || nudgeError;
  const displayTitle = nudge?.title ?? (!hasNudgeSystem || nudgeError ? title : '');
  const displayBody = nudge?.body ?? (!hasNudgeSystem || nudgeError ? body : '');

  if (nudgeLoading) {
    return (
      <div className={cn('space-y-2', isFrame && 'px-1 pt-4')}>
        <Skeleton className={cn(isFrame ? 'h-4 w-4/5' : 'h-3.5 w-3/4')} />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  if (nudgeError && !nudge) {
    return (
      <div className={cn(isFrame && 'px-1 pt-2')}>
        {(displayTitle || displayBody) ? (
          <div className="space-y-2 pb-2">
            {displayTitle ? (
              <p className="text-sm font-medium leading-snug tracking-wide text-foreground">{displayTitle}</p>
            ) : null}
            {displayBody ? (
              <p className="text-sm leading-relaxed tracking-wide text-foreground">{displayBody}</p>
            ) : null}
          </div>
        ) : null}
        <CompanionError companionType="grounding" onRetry={onRetry} />
      </div>
    );
  }

  if (!displayTitle && !displayBody) return null;

  if (isFrame) {
    const excerpt = truncateExcerpt(displayBody);
    return (
      <div className="space-y-2 pt-2">
        {displayTitle ? (
          <p className="text-sm font-medium leading-snug tracking-wide text-foreground">{displayTitle}</p>
        ) : null}
        {excerpt ? (
          <p className="text-sm leading-relaxed tracking-wide text-foreground">{excerpt}</p>
        ) : null}
        {nudge?.citation ? (
          <p className="text-sm font-medium leading-snug tracking-wide text-muted-foreground">{nudge.citation}</p>
        ) : null}
        {pauseInstanceId ? (
          <CompanionOpenFullViewButton pauseInstanceId={pauseInstanceId} routeSegment="grounding" />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 py-3">
      <p className="text-xs font-mono font-medium text-foreground/80">{displayTitle}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{displayBody}</p>
      {nudge?.citation ? (
        <div className="flex items-center gap-1.5 pt-1">
          <p className="text-[9px] font-mono text-muted-foreground/40">{nudge.citation}</p>
          {nudge.url ? (
            <a
              href={nudge.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-nox-text-link/60 hover:text-nox-text-link transition-colors"
              aria-label={t('grounding.viewResearch')}
            >
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
