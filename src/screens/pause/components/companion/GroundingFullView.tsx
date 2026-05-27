import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanionError } from '../CompanionError';
import { ReadTime } from './ReadTime';
import { WhyThisCard } from './WhyThisCard';

interface NudgeData {
  title: string;
  body: string;
  citation: string;
  url: string;
}

interface Props {
  nudge: NudgeData | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
  mood?: string | null;
  marketDirection?: 'up' | 'down' | 'neutral' | null;
  preferredBias?: string | null;
}

/**
 * Full-page Grounding (research nudge) presentation.
 *
 * Differs from the inline `LearningInput` in that the citation is promoted
 * from a tiny icon-link footnote into a proper "Read the paper" CTA.
 */
export function GroundingFullView({
  nudge,
  loading,
  error,
  onRetry,
  mood,
  marketDirection,
  preferredBias,
}: Props) {
  "use memo";
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (error || !nudge) {
    return <CompanionError companionType="grounding" onRetry={onRetry} />;
  }

  const bodyChars = nudge.title.length + nudge.body.length + (nudge.citation?.length ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <ReadTime chars={bodyChars} />
        <WhyThisCard
          companion="grounding"
          mood={mood}
          marketDirection={marketDirection}
          preferredBias={preferredBias}
          className="ml-auto"
        />
      </div>

      <h2 className="text-base font-medium leading-snug text-foreground">{nudge.title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{nudge.body}</p>

      {nudge.citation && (
        <div className="pt-2 space-y-2 border-t border-border/20">
          <p className="text-xs font-mono text-muted-foreground/75 leading-snug">
            {nudge.citation}
          </p>
          {nudge.url && (
            <a
              href={nudge.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-nox-text-link/90 hover:text-nox-text-link transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {t('companions.fullview.grounding.readPaper')}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
