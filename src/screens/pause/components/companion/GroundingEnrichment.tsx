import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import type { GroundingEnrichment as EnrichmentData } from '@/features/pause/public-queries';

interface Props {
  data: EnrichmentData | null | undefined;
  loading: boolean;
  error: boolean;
}

/**
 * Renders the enrichment block (abstract preview + researcher bios + citation
 * count) below the Grounding body on the Full View. Deliberately silent on
 * missing data: if all three upstream providers failed for this citation we
 * render nothing rather than a sad "couldn't enrich" banner — the body + DOI
 * link above already deliver the core experience.
 */
export function GroundingEnrichment({ data, loading, error }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="pt-4 space-y-2 border-t border-border/15">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (error || !data) return null;

  const hasAbstract = Boolean(data.abstract);
  const hasResearchers = data.researchers.some((r) => r.bio || r.name);
  const hasCitationCount = typeof data.citation_count === 'number';

  if (!hasAbstract && !hasResearchers && !hasCitationCount) return null;

  return (
    <section
      className="pt-4 space-y-4 border-t border-border/15"
      aria-label={t('companions.fullview.grounding.enrichment.sectionLabel')}
    >
      {hasAbstract && (
        <div className="space-y-1.5">
          <h3 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold">
            {t('companions.fullview.grounding.enrichment.abstractHeading')}
          </h3>
          <p className="text-sm text-muted-foreground/90 leading-relaxed">{data.abstract}</p>
        </div>
      )}

      {hasResearchers && (
        <div className="space-y-1.5">
          <h3 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold">
            {t('companions.fullview.grounding.enrichment.researchersHeading')}
          </h3>
          <ul className="space-y-2">
            {data.researchers.map((r, i) => (
              <li key={`${r.name}-${i}`} className="text-sm leading-relaxed">
                <span className="font-medium text-foreground/90">{r.name}</span>
                {r.bio && <span className="text-muted-foreground/85"> — {r.bio}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasCitationCount && (
        <p className="text-[11px] text-muted-foreground/60 font-mono">
          {t('companions.fullview.grounding.enrichment.citationCount', {
            count: data.citation_count as number,
          })}
        </p>
      )}
    </section>
  );
}
