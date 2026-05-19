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
  /**
   * Placeholder slot for PR 2's `grounding-enrich` edge function output
   * (abstract + researcher bios + citation count). Accepts a ReactNode so the
   * page can own the fetching and render what it likes. Rendered *after* the
   * body + citation link so the primary content stays front-and-center.
   */
  enrichmentSlot?: React.ReactNode;
}

/**
 * Full-page Grounding (research nudge) presentation.
 *
 * Differs from the inline `LearningInput` in that the citation is promoted
 * from a tiny icon-link footnote into a proper "Read the paper" CTA, and the
 * page leaves room for a rich enrichment block (abstract, researchers, citation
 * count) that the inline card can't host.
 */
export function GroundingFullView({
  nudge,
  loading,
  error,
  onRetry,
  mood,
  marketDirection,
  preferredBias,
  enrichmentSlot,
}: Props) {
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

      {/* PR 2 enrichment — abstract preview, researcher bios, citation count.
          Placeholder in PR 1; wired in PR 2 via <GroundingEnrichment /> rendered
          by CompanionGroundingPage. Hides gracefully when nothing is available. */}
      {enrichmentSlot}
    </div>
  );
}
