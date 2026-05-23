import { useTranslation } from 'react-i18next';
import { OutcomeIcon } from '@/components/icons/OutcomeIcon';

export type PauseDoneBriefOutcomeHeroProps = {
  decision: string | null;
};

/** Brief Done: saved confirmation + decision outcome headline. */
export function PauseDoneBriefOutcomeHero({ decision }: PauseDoneBriefOutcomeHeroProps) {
  const { t } = useTranslation();

  const outcomeHeadline =
    decision === 'held'
      ? t('pause.brief.done.outcomeHeld')
      : decision === 'sold'
        ? t('pause.brief.done.outcomeSold')
        : decision === 'bought'
          ? t('pause.brief.done.outcomeBought')
          : t('pause.brief.done.outcomeFallback', { defaultValue: 'Nice work' });

  const outcomeIconKey =
    decision === 'held' || decision === 'sold' || decision === 'bought' ? decision : 'held';

  return (
    <>
      <p className="text-base font-medium italic leading-6 text-muted-foreground">
        {t('pause.brief.done.completedSaved')}
      </p>

      <div className="flex flex-col items-center gap-4">
        <OutcomeIcon outcome={outcomeIconKey} size={44} className="text-foreground" aria-hidden />
        <div className="flex max-w-sm flex-col gap-2">
          <h2 className="text-[22px] font-normal leading-7 tracking-tight text-foreground">{outcomeHeadline}</h2>
        </div>
      </div>
    </>
  );
}
