import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanionError } from './CompanionError';
import { useTranslation } from 'react-i18next';

interface NudgeData {
  title: string;
  body: string;
  citation: string;
  url: string;
}

interface Props {
  title: string;
  body: string;
  nudge?: NudgeData | null;
  nudgeLoading?: boolean;
  nudgeError?: boolean;
  onRetry?: () => void;
}

export function LearningInput({ title, body, nudge, nudgeLoading = false, nudgeError = false, onRetry }: Props) {
  const { t } = useTranslation();
  const hasNudgeSystem = nudge !== undefined || nudgeLoading || nudgeError;
  const displayTitle = nudge?.title ?? (!hasNudgeSystem || nudgeError ? title : '');
  const displayBody = nudge?.body ?? (!hasNudgeSystem || nudgeError ? body : '');

  if (nudgeLoading) {
    return (
      <div className="py-3 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  // Failed to load expanded grounding — show retry even when reflection has no featured title/body
  // (SignalDisplay does this first; we used to `return null` here and hid CompanionError).
  if (nudgeError && !nudge) {
    return (
      <div className="py-3 space-y-1.5">
        {(displayTitle || displayBody) ? (
          <>
            <p className="text-xs font-mono font-medium text-foreground/80">{displayTitle}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{displayBody}</p>
          </>
        ) : null}
        <CompanionError companionType="grounding" onRetry={onRetry} />
      </div>
    );
  }

  if (!displayTitle && !displayBody) return null;

  return (
    <div className="py-3 space-y-1.5">
      <p className="text-xs font-mono font-medium text-foreground/80">{displayTitle}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{displayBody}</p>
      {nudge?.citation && (
        <div className="flex items-center gap-1.5 pt-1">
          <p className="text-[9px] font-mono text-muted-foreground/40">
            {nudge.citation}
          </p>
          {nudge.url && (
            <a
              href={nudge.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-nox-text-link/60 hover:text-nox-text-link transition-colors"
              aria-label={t('grounding.viewResearch')}
            >
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
