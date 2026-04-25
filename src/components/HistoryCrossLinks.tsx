import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { journeyPath, TOOLS } from '@/lib/app-routes';

export type HistoryCrossLinkId = 'library' | 'journeyActivity' | 'groundHistory';

const linkClass =
  'text-muted-foreground underline underline-offset-2 decoration-muted-foreground/50 hover:text-foreground hover:decoration-foreground/40';

const hrefFor = (id: HistoryCrossLinkId): string => {
  if (id === 'library') return '/library';
  if (id === 'journeyActivity') return journeyPath('activity');
  return TOOLS.groundHistory;
};

/**
 * Ties together the three “where is my past?” surfaces (see docs/design/information-architecture.md §3.3).
 */
export function HistoryCrossLinks({ links }: { links: [HistoryCrossLinkId, ...HistoryCrossLinkId[]] }) {
  const { t } = useTranslation();

  const label = (id: HistoryCrossLinkId) => {
    if (id === 'library') return t('ia.crossLinkLibrary', { defaultValue: 'Library' });
    if (id === 'journeyActivity') {
      return t('ia.crossLinkJourneyActivity', { defaultValue: 'Journey — Activity' });
    }
    return t('ia.crossLinkGroundHistory', { defaultValue: 'Grounding history' });
  };

  return (
    <p className="text-xs text-muted-foreground/80 leading-relaxed">
      <span className="text-muted-foreground/70">
        {t('ia.crossLinkIntro', { defaultValue: 'See also:' })}{' '}
      </span>
      {links.map((id, i) => (
        <Fragment key={id}>
          {i > 0 ? ' · ' : null}
          <Link to={hrefFor(id)} className={linkClass}>
            {label(id)}
          </Link>
        </Fragment>
      ))}
    </p>
  );
}
