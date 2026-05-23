import { Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export type CompanionFullViewRouteSegment = 'signal' | 'grounding' | 'zoom-out' | 'history';

export type CompanionOpenFullViewButtonProps = {
  pauseInstanceId: string;
  routeSegment: CompanionFullViewRouteSegment;
};

/** Inline companion card CTA → dedicated full-view route. */
export function CompanionOpenFullViewButton({ pauseInstanceId, routeSegment }: CompanionOpenFullViewButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="pt-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() =>
          navigate(`/companion/${routeSegment}/${pauseInstanceId}`, { state: { from: 'pause' } })
        }
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border/40 bg-muted/20 py-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/35"
      >
        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
        {t('companions.openFullView')}
      </button>
    </div>
  );
}
