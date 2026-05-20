import { useTranslation } from 'react-i18next';

/** Brief Done: Journey framing and stats explainer copy. */
export function PauseDoneBriefJourneyCopy() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md space-y-3 text-center">
      <p className="text-sm font-medium leading-snug text-foreground">
        {t('pause.brief.done.journeyShort', {
          defaultValue: 'This pause is now part of your Journey.',
        })}
      </p>
      <p className="mx-auto max-w-sm text-xs leading-relaxed text-foreground">
        {t('pause.brief.done.practiceAffirmLead', {
          defaultValue:
            'Stopping to decide is what matters here. Journey learns from your pauses over time — not a single grade on this moment.',
        })}
      </p>
      <p className="mx-auto max-w-sm text-[11px] leading-relaxed text-muted-foreground">
        {t('pause.brief.done.statsPatternExplainer', {
          defaultValue:
            'Holzen and skill bars in Stats summarize patterns across many completed pauses. They can move slowly and are never a verdict on whether pausing was the right call.',
        })}
      </p>
    </div>
  );
}
